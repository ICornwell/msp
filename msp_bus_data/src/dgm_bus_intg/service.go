package main

import "dgm_bus_intg/routes"

func main() {
	routes.Run() // listen and serve on 0.0.0.0:5000 (for windows "localhost:5000")
}
