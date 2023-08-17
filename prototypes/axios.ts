import axios from "axios";

(async () => {
    const gateway = axios.create({ baseURL: "http://10.10.50.14:9091/metrics/job/randomess-exporter/" });

    await gateway.post("/instance/test", ["# TYPE rand_0 counter", 'rand_0{actor="dice3"} 12345', ""].join("\n"));
})();
