mod ledger;
mod validator;
mod models;
mod parser;
mod mapper;

use poem::{handler, listener::TcpListener, post, web::Data, Route, Server};
use serde_json::json;

#[handler]
fn parse_endpoint(body: String) -> poem::Result<poem::web::Json<serde_json::Value>> {
    // 1. Run the nom parser to get RawSegments
    let raw_segments = parser::parse_usm(&body).map_err(|e| {
        poem::Error::from_string(e, poem::http::StatusCode::BAD_REQUEST)
    })?;

    // 2. Map into strong typed JSON models
    let usm_json = mapper::map_to_usm(raw_segments).map_err(|e| {
        poem::Error::from_string(e, poem::http::StatusCode::UNPROCESSABLE_ENTITY)
    })?;

    Ok(poem::web::Json(json!(usm_json)))
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    if std::env::var_os("RUST_LOG").is_none() {
        unsafe { std::env::set_var("RUST_LOG", "poem=info"); }
    }
    
    let app = Route::new().at("/parse", post(parse_endpoint));
    println!("USM Parser API starting on http://127.0.0.1:5050");

    Server::new(TcpListener::bind("127.0.0.1:5050"))
        .run(app)
        .await
}
