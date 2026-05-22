use deadpool_postgres::Client;
use tokio_postgres::types::ToSql;


use crate::{
    error::{DocGraphError, Result},
    model::{
        Edge, GraphElements, QueryMessage, QueryObject, QueryRelation, QueryResponse,
        Vertex,
    },
};

use super::maps::{edge_from_row, vertex_from_row};

pub async fn read_data(client: Client, query_message: QueryMessage) -> Result<QueryResponse> {
    let start = query_message
        .query_objects
        .iter()
        .find(|obj| obj.is_query_root);

    let response = match start {
        Some(query_object) => {
            let current_sql = vec![format!(
                r#"WITH S1 AS (SELECT 'v' AS otype, id, __originalId, __entityId, __transactionid, __label, __isEntity, __viewtype, __timestamp, __businessKey, __alternateKey, content, 'na' AS from_id, 'na' AS to_id
                FROM vertices v1 WHERE __entityid = $1 AND __isentity = true AND NOT EXISTS (SELECT 1 FROM edges e WHERE e.from_id = v1.id AND e.__label = 'supersededBy')
                )"#
            )];

            let (final_idx, final_sql) = build_sql_for_query_object(
                query_object,
                &query_message.query_objects,
                &query_message.query_relations,
                current_sql,
                2,
            );

            let mut cte_sql = final_sql.join(",\n");
            cte_sql = format!("{}\nSELECT * FROM S1\n", cte_sql);

            for i in 2..final_idx {
                cte_sql = format!("{}UNION\nSELECT * FROM S{}\n", cte_sql, i);
            }

            // debug write of the sql for sql debugging!
            // error!("got sql:\n{}\n", cte_sql);

            let query_key = query_message.root_query_key_value.clone();
            let params: &[&(dyn ToSql + Sync)] = &[&query_key];
            let result: Vec<tokio_postgres::Row> = client
                .query(&cte_sql, params)
                .await
                .map_err(DocGraphError::Database)?;

            let edges: Vec<Edge> = result
                .iter()
                .filter_map(|row| match row.get::<usize, &str>(0) {
                    "e" => Some(edge_from_row(row)),
                    _ => None,
                })
                .collect();

            let vertices: Vec<Vertex> = result
                .iter()
                .filter_map(|row| match row.get::<usize, &str>(0) {
                    "v" => Some(vertex_from_row(row)),
                    _ => None,
                })
                .collect();

            let result_graph_elements = GraphElements {
                vertices: Some(vertices),
                edges: Some(edges),
            };

            let query_response = QueryResponse {
                data: Some(result_graph_elements),
                success: true,
                message: Some("query executed".to_string()),
            };
            Ok(query_response)
        }
        None => Err(DocGraphError::Validation("no start object".to_string())),
    }
    .map_err(|err| DocGraphError::Validation(err.to_string()))?;
    Ok(response)
}

fn build_sql_for_query_object(
    current_object: &QueryObject,
    objects: &[QueryObject],
    relations: &[QueryRelation],
    mut current_sql: Vec<String>,
    mut idx: i32,
) -> (i32, Vec<String>) {
    let base_idx = idx;
    for relation in relations {
        if relation.is_relation_from_id(&current_object.query_object_id) {
            // this is possibly going to get very, very slow when number of edges for a lable grows - we need to tie the edge to the current object id 
            // unless Postgres has some super optimisation for EXISTS with a primary key lookup - which it might
            // or we switch to an inner join (CTE to edges) instead of exists or use IN with a subquery of the current object ids from the previous step
            // however postgres does have some excellet query planners, so we'll test with volume before trying to optimise this
            current_sql.push(format!(
                r#"{} AS (SELECT 'e' AS otype, e1.id, 'na' as __originalId, e1.__entityId, e1.__transactionid, e1.__label, FALSE as __isEntity, e1.__viewtype, e1.__timestamp, 'na' AS __businessKey, 'na' AS __alternateKey, e1.content, e1.from_id, e1.to_id
                FROM edges e1 WHERE e1.__label = '{}' AND EXISTS (SELECT 1 FROM {} v WHERE v.id = e1.from_id)
                )"#,
                format!("S{}", idx),
                relation.label,
                format!("S{}", base_idx - 1)
            ));
            idx += 1;

            if let Some(object) = objects.iter().find(|v| v.is_object_with_id(&relation.to_object))
            {
                // this is possiblygoing to get very, very slow when number of edges for a lable grows - we need to tie the edge to the current object id
                current_sql.push(format!(
                    r#"{} AS (SELECT 'v' AS otype, id, __originalId, __entityId, __transactionid, __label, __isEntity, __viewtype, __timestamp, __businessKey, __alternateKey, content, 'na' AS from_id, 'na' AS to_id
                    FROM vertices v2 WHERE __label = '{}' AND EXISTS (SELECT 1 FROM {} e WHERE e.to_id = v2.id) AND NOT EXISTS (SELECT 1 FROM edges e WHERE e.from_id = v2.id AND e.__label = 'supersededBy')
                    )"#,
                    format!("S{}", idx),
                    object.label,
                    format!("S{}", idx - 1)
                ));
                idx += 1;

                let (new_idx, new_sql) = build_sql_for_query_object(
                    object,
                    objects,
                    relations,
                    current_sql,
                    idx,
                );
                idx = new_idx;
                current_sql = new_sql;
            }
        }
    }

    (idx, current_sql)
}
