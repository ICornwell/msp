#![allow(dead_code)]

use chrono::Utc;
use serde_json::json;
use uuid::Uuid;

use docgraph::model::{
    Edge, GraphElements, QueryMessage, QueryObject, QueryRelation, UpdateMessage, Vertex,
};

#[derive(Clone)]
pub struct CommerceFixture {
    pub account: Vertex,
    pub account_owner: Vertex,
    pub supplier: Vertex,
    pub product: Vertex,
    pub order: Vertex,
    pub line_item_1: Vertex,
    pub line_item_2: Vertex,
    pub shipping_address: Vertex,
    pub edges: Vec<Edge>,
}

impl CommerceFixture {
    pub fn with_transaction(mut self, transaction_id: &str, timestamp: i64) -> Self {
        for vertex in self.all_vertices_mut() {
            vertex.transaction_id = transaction_id.to_string();
            vertex.timestamp = timestamp;
        }
        for edge in &mut self.edges {
            edge.transaction_id = transaction_id.to_string();
            edge.timestamp = timestamp;
        }
        self
    }

    pub fn vertices(&self) -> Vec<Vertex> {
        vec![
            self.account.clone(),
            self.account_owner.clone(),
            self.supplier.clone(),
            self.product.clone(),
            self.order.clone(),
            self.line_item_1.clone(),
            self.line_item_2.clone(),
            self.shipping_address.clone(),
        ]
    }

    pub fn as_add_message(&self) -> UpdateMessage {
        UpdateMessage {
            add: Some(GraphElements {
                vertices: Some(self.vertices()),
                edges: Some(self.edges.clone()),
            }),
            update: None,
            delete: None,
        }
    }

    pub fn as_query_message(&self, root_entity_id: &str) -> QueryMessage {
        QueryMessage {
            version: "1.0".to_string(),
            user: "test".to_string(),
            query_date: "2026-01-01".to_string(),
            view: "commerce".to_string(),
            view_version: "1.0".to_string(),
            root_query_key_property: "id".to_string(),
            root_query_key_value: root_entity_id.to_string(),
            root_query_key_types: "all".to_string(),
            use_entity_id_as_key: false,
            is_latest_only: true,
            timestamp: Utc::now().timestamp(),
            query_type: "graph".to_string(),
            query_objects: vec![
                QueryObject {
                    label: "Account".to_string(),
                    original_label: "Account".to_string(),
                    is_query_root: true,
                    query_object_id: "a".to_string(),
                    attributes: vec!["id".to_string(), "name".to_string(), "status".to_string()],
                },
                QueryObject {
                    label: "Order".to_string(),
                    original_label: "Order".to_string(),
                    is_query_root: false,
                    query_object_id: "o".to_string(),
                    attributes: vec!["id".to_string(), "orderNumber".to_string()],
                },
                QueryObject {
                    label: "OrderLineItem".to_string(),
                    original_label: "OrderLineItem".to_string(),
                    is_query_root: false,
                    query_object_id: "li".to_string(),
                    attributes: vec!["id".to_string(), "quantity".to_string(), "unitPrice".to_string()],
                },
                QueryObject {
                    label: "Product".to_string(),
                    original_label: "Product".to_string(),
                    is_query_root: false,
                    query_object_id: "p".to_string(),
                    attributes: vec!["id".to_string(), "sku".to_string(), "name".to_string()],
                },
                QueryObject {
                    label: "Supplier".to_string(),
                    original_label: "Supplier".to_string(),
                    is_query_root: false,
                    query_object_id: "s".to_string(),
                    attributes: vec!["id".to_string(), "supplierCode".to_string(), "name".to_string()],
                },
            ],
            query_relations: vec![
                QueryRelation {
                    from_object: "a".to_string(),
                    to_object: "o".to_string(),
                    label: "placedOrder".to_string(),
                    reverse: false,
                },
                QueryRelation {
                    from_object: "o".to_string(),
                    to_object: "li".to_string(),
                    label: "containsLineItem".to_string(),
                    reverse: false,
                },
                QueryRelation {
                    from_object: "li".to_string(),
                    to_object: "p".to_string(),
                    label: "lineItemForProduct".to_string(),
                    reverse: false,
                },
                QueryRelation {
                    from_object: "p".to_string(),
                    to_object: "s".to_string(),
                    label: "suppliedBy".to_string(),
                    reverse: false,
                },
            ],
        }
    }

    fn all_vertices_mut(&mut self) -> Vec<&mut Vertex> {
        vec![
            &mut self.account,
            &mut self.account_owner,
            &mut self.supplier,
            &mut self.product,
            &mut self.order,
            &mut self.line_item_1,
            &mut self.line_item_2,
            &mut self.shipping_address,
        ]
    }
}

pub fn commerce_fixture(seed: &str) -> CommerceFixture {
    let key_suffix = Uuid::now_v7().to_string();

    let account = entity_vertex(
        "Account",
        &format!("acc-{seed}"),
        &format!("account-{seed}-{key_suffix}"),
        json!({
            "name": format!("Acme Account {seed}"),
            "status": "Active",
            "creditLimit": 50000
        }),
        vec![
            "ownedBy".to_string(),
            "placedOrder".to_string(),
            "preferredSupplier".to_string(),
        ],
    );

    let account_owner = entity_vertex(
        "AccountOwner",
        &format!("owner-{seed}"),
        &format!("owner-{seed}-{key_suffix}"),
        json!({
            "name": "Jordan Reeves",
            "email": "jordan.reeves@example.com"
        }),
        vec!["ownedBy".to_string()],
    );

    let supplier = entity_vertex(
        "Supplier",
        &format!("supplier-{seed}"),
        &format!("supplier-{seed}-{key_suffix}"),
        json!({
            "supplierCode": format!("SUP-{seed}"),
            "name": "Northwind Components"
        }),
        vec!["suppliedBy".to_string(), "preferredSupplier".to_string()],
    );

    let product = entity_vertex(
        "Product",
        &format!("product-{seed}"),
        &format!("sku-{seed}-{key_suffix}"),
        json!({
            "sku": format!("SKU-{seed}"),
            "name": "Industrial Sensor",
            "unitPrice": 129.99
        }),
        vec!["lineItemForProduct".to_string(), "suppliedBy".to_string()],
    );

    let order = entity_vertex(
        "Order",
        &format!("order-{seed}"),
        &format!("order-{seed}-{key_suffix}"),
        json!({
            "orderNumber": format!("ORD-{seed}"),
            "status": "Pending"
        }),
        vec![
            "placedOrder".to_string(),
            "containsLineItem".to_string(),
            "shippingAddress".to_string(),
        ],
    );

    let line_item_1 = value_vertex(
        "OrderLineItem",
        &format!("li-1-{seed}"),
        json!({"lineNo": 1, "quantity": 2, "unitPrice": 129.99}),
    );

    let line_item_2 = value_vertex(
        "OrderLineItem",
        &format!("li-2-{seed}"),
        json!({"lineNo": 2, "quantity": 1, "unitPrice": 89.50}),
    );

    let shipping_address = value_vertex(
        "Address",
        &format!("ship-addr-{seed}"),
        json!({
            "line1": "10 Commerce Street",
            "city": "Melbourne",
            "country": "AU"
        }),
    );

    let edges = vec![
        edge(&account.tmp_id, &account_owner.tmp_id, "ownedBy"),
        edge(&account.tmp_id, &order.tmp_id, "placedOrder"),
        edge(&order.tmp_id, &line_item_1.tmp_id, "containsLineItem"),
        edge(&order.tmp_id, &line_item_2.tmp_id, "containsLineItem"),
        edge(&line_item_1.tmp_id, &product.tmp_id, "lineItemForProduct"),
        edge(&line_item_2.tmp_id, &product.tmp_id, "lineItemForProduct"),
        edge(&product.tmp_id, &supplier.tmp_id, "suppliedBy"),
        edge(&account.tmp_id, &supplier.tmp_id, "preferredSupplier"),
        edge(&order.tmp_id, &shipping_address.tmp_id, "shippingAddress"),
    ];

    CommerceFixture {
        account,
        account_owner,
        supplier,
        product,
        order,
        line_item_1,
        line_item_2,
        shipping_address,
        edges,
    }
}

pub fn product_price_update(
    persisted_product: &Vertex,
    new_price: f64,
    transaction_id: &str,
    timestamp: i64,
) -> UpdateMessage {
    let mut updated = persisted_product.clone_with_new_id(Uuid::now_v7().to_string());
    updated.transaction_id = transaction_id.to_string();
    updated.timestamp = timestamp;

    let mut content = updated.content.clone();
    if let Some(obj) = content.as_object_mut() {
        obj.insert("unitPrice".to_string(), json!(new_price));
    }
    updated.content = content;

    UpdateMessage {
        add: None,
        update: Some(GraphElements {
            vertices: Some(vec![updated]),
            edges: None,
        }),
        delete: None,
    }
}

#[derive(Clone)]
pub struct SnapshotHistoryScenario {
    pub seed: String,
    pub fixture: CommerceFixture,
    pub tx_create: String,
    pub tx_price_v2: String,
    pub tx_price_v3: String,
    pub ts_create: i64,
    pub ts_price_v2: i64,
    pub ts_price_v3: i64,
    pub price_v1: f64,
    pub price_v2: f64,
    pub price_v3: f64,
}

impl SnapshotHistoryScenario {
    pub fn initial_add_message(&self) -> UpdateMessage {
        self.fixture
            .clone()
            .with_transaction(&self.tx_create, self.ts_create)
            .as_add_message()
    }

    pub fn price_update_v2_message(&self, persisted_product: &Vertex) -> UpdateMessage {
        product_price_update(
            persisted_product,
            self.price_v2,
            &self.tx_price_v2,
            self.ts_price_v2,
        )
    }

    pub fn price_update_v3_message(&self, persisted_product: &Vertex) -> UpdateMessage {
        product_price_update(
            persisted_product,
            self.price_v3,
            &self.tx_price_v3,
            self.ts_price_v3,
        )
    }

    pub fn query_at_timestamp(&self, root_entity_id: &str, timestamp: i64) -> serde_json::Value {
        query_payload_for_commerce(root_entity_id, timestamp)
    }

    pub fn expected_price_at_or_before(&self, timestamp: i64) -> f64 {
        if timestamp >= self.ts_price_v3 {
            self.price_v3
        } else if timestamp >= self.ts_price_v2 {
            self.price_v2
        } else {
            self.price_v1
        }
    }
}

pub fn snapshot_history_scenario() -> SnapshotHistoryScenario {
    let seed = "snapshot-history".to_string();
    let fixture = commerce_fixture(&seed);
    let base_price = fixture.product.content["unitPrice"].as_f64().unwrap_or(129.99);

    SnapshotHistoryScenario {
        seed,
        fixture,
        tx_create:  Uuid::now_v7().to_string(),
        tx_price_v2: Uuid::now_v7().to_string(),
        tx_price_v3: Uuid::now_v7().to_string(),
        ts_create: 1_710_000_000,
        ts_price_v2: 1_710_000_100,
        ts_price_v3: 1_710_000_200,
        price_v1: base_price,
        price_v2: 142.50,
        price_v3: 136.25,
    }
}

#[derive(Clone)]
pub struct ReadCommittedFallbackScenario {
    pub seed: String,
    pub fixture: CommerceFixture,
    pub tx_create: String,
    pub tx_committed_update: String,
    pub tx_pending_update: String,
    pub ts_create: i64,
    pub ts_committed_update: i64,
    pub ts_pending_update: i64,
    pub price_committed: f64,
    pub price_pending: f64,
}

impl ReadCommittedFallbackScenario {
    pub fn initial_add_message(&self) -> UpdateMessage {
        self.fixture
            .clone()
            .with_transaction(&self.tx_create, self.ts_create)
            .as_add_message()
    }

    pub fn committed_price_update_message(&self, persisted_product: &Vertex) -> UpdateMessage {
        product_price_update(
            persisted_product,
            self.price_committed,
            &self.tx_committed_update,
            self.ts_committed_update,
        )
    }

    pub fn pending_price_update_message(&self, persisted_product: &Vertex) -> UpdateMessage {
        product_price_update(
            persisted_product,
            self.price_pending,
            &self.tx_pending_update,
            self.ts_pending_update,
        )
    }

    pub fn fallback_timestamp(&self) -> i64 {
        self.ts_pending_update.saturating_sub(1)
    }

    pub fn query_without_pending_tx(&self, root_entity_id: &str) -> serde_json::Value {
        query_payload_for_commerce(root_entity_id, self.fallback_timestamp())
    }

    pub fn expected_read_committed_price(&self) -> f64 {
        self.price_committed
    }

    pub fn expected_with_pending_tx_price(&self) -> f64 {
        self.price_pending
    }
}

pub fn read_committed_fallback_scenario() -> ReadCommittedFallbackScenario {
    let seed = "read-committed-fallback".to_string();
    let fixture = commerce_fixture(&seed);

    ReadCommittedFallbackScenario {
        seed,
        fixture,
        tx_create:  Uuid::now_v7().to_string(),
        tx_committed_update: Uuid::now_v7().to_string(),
        tx_pending_update: Uuid::now_v7().to_string(),
        ts_create: 1_710_100_000,
        ts_committed_update: 1_710_100_100,
        ts_pending_update: 1_710_100_200,
        price_committed: 118.75,
        price_pending: 164.20,
    }
}

fn entity_vertex(
    label: &str,
    tmp_id: &str,
    business_key: &str,
    content: serde_json::Value,
    view_managed_edges: Vec<String>,
) -> Vertex {
    Vertex {
        id: String::new(),
        tmp_id: tmp_id.to_string(),
        original_id: String::new(),
        entity_id: tmp_id.to_string(),
        transaction_id: String::new(),
        label: label.to_string(),
        is_entity: true,
        view_type: "commerce".to_string(),
        timestamp: 0,
        view_managed_edges,
        business_key: business_key.to_string(),
        alternate_key: String::new(),
        content,
    }
}

fn value_vertex(label: &str, tmp_id: &str, content: serde_json::Value) -> Vertex {
    Vertex {
        id: String::new(),
        tmp_id: tmp_id.to_string(),
        original_id: String::new(),
        entity_id: tmp_id.to_string(),
        transaction_id: String::new(),
        label: label.to_string(),
        is_entity: false,
        view_type: "commerce".to_string(),
        timestamp: 0,
        view_managed_edges: vec![],
        business_key: String::new(),
        alternate_key: String::new(),
        content,
    }
}

fn edge(from_tmp_id: &str, to_tmp_id: &str, label: &str) -> Edge {
    Edge {
        id: String::new(),
        entity_id: String::new(),
        transaction_id: String::new(),
        label: label.to_string(),
        view_type: "commerce".to_string(),
        from: from_tmp_id.to_string(),
        to: to_tmp_id.to_string(),
        from_entity_id: from_tmp_id.to_string(),
        to_entity_id: to_tmp_id.to_string(),
        timestamp: 0,
        content: json!({}),
    }
}

fn query_payload_for_commerce(root_entity_id: &str, timestamp: i64) -> serde_json::Value {
    json!({
        "version": "1.0",
        "user": "test",
        "queryDate": "2026-01-01",
        "view": "commerce",
        "viewVersion": "1.0",
        "rootQueryKeyProperty": "id",
        "rootQueryKeyValue": root_entity_id,
        "rootQueryKeyTypes": "all",
        "useEntityIdAsKey": false,
        "isLatestOnly": true,
        "timeStamp": timestamp,
        "queryType": "graph",
        "getObjects": [
            {
                "type": "Account",
                "originalType": "Account",
                "isQueryRoot": true,
                "queryObjectId": "a",
                "attributes": ["id", "name", "status"]
            },
            {
                "type": "Order",
                "originalType": "Order",
                "isQueryRoot": false,
                "queryObjectId": "o",
                "attributes": ["id", "orderNumber"]
            },
            {
                "type": "OrderLineItem",
                "originalType": "OrderLineItem",
                "isQueryRoot": false,
                "queryObjectId": "li",
                "attributes": ["id", "quantity", "unitPrice"]
            },
            {
                "type": "Product",
                "originalType": "Product",
                "isQueryRoot": false,
                "queryObjectId": "p",
                "attributes": ["id", "sku", "name", "unitPrice"]
            },
            {
                "type": "Supplier",
                "originalType": "Supplier",
                "isQueryRoot": false,
                "queryObjectId": "s",
                "attributes": ["id", "supplierCode", "name"]
            }
        ],
        "getRelations": [
            {
                "from": "a",
                "to": "o",
                "type": "placedOrder",
                "reverse": false
            },
            {
                "from": "o",
                "to": "li",
                "type": "containsLineItem",
                "reverse": false
            },
            {
                "from": "li",
                "to": "p",
                "type": "lineItemForProduct",
                "reverse": false
            },
            {
                "from": "p",
                "to": "s",
                "type": "suppliedBy",
                "reverse": false
            }
        ]
    })
}
