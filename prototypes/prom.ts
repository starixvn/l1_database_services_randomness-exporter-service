import Prom from "prom-client";

(async () => {
    const rand_0 = new Prom.Counter({name: "rand_0", help: "Randomize 0", labelNames: ["actor", ""]});

    rand_0.inc({actor: "dice1"}, 12)

    console.log(rand_0);
    console.log(await Prom.register.metrics());
})()
