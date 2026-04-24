const { checkLogin } = require("../util-server");
const { R } = require("redbean-node");
const { createPrtgClient } = require("../prtg-client");

/**
 * Kyosei Dash — PRTG server registry socket handlers.
 * @param {Socket} socket Socket.io instance
 * @returns {void}
 */
module.exports.prtgServerSocketHandler = (socket) => {
    socket.on("getPrtgServerList", async (callback) => {
        try {
            checkLogin(socket);
            const rows = await R.findAll("prtg_server");
            const list = rows.map((r) => ({
                id: r.id,
                name: r.name,
                url: r.url,
                username: r.username,
                useApiToken: !!r.use_api_token,
                ignoreSsl: !!r.ignore_ssl,
                hasPasshash: !!r.passhash,
                hasApiToken: !!r.api_token,
            }));
            callback({ ok: true, list });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("savePrtgServer", async (data, id, callback) => {
        try {
            checkLogin(socket);
            let bean;
            if (id) {
                bean = await R.findOne("prtg_server", "id = ?", [id]);
                if (!bean) {
                    throw new Error("PRTG server not found");
                }
            } else {
                bean = R.dispense("prtg_server");
            }
            bean.name = data.name;
            bean.url = data.url;
            bean.username = data.username || null;
            if (data.passhash) {
                bean.passhash = data.passhash;
            }
            if (data.apiToken) {
                bean.api_token = data.apiToken;
            }
            bean.use_api_token = !!data.useApiToken;
            bean.ignore_ssl = !!data.ignoreSsl;
            const newId = await R.store(bean);
            callback({ ok: true, id: newId });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("deletePrtgServer", async (id, callback) => {
        try {
            checkLogin(socket);
            const bean = await R.findOne("prtg_server", "id = ?", [id]);
            if (bean) {
                await R.trash(bean);
            }
            callback({ ok: true });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("testPrtgServer", async (data, callback) => {
        try {
            checkLogin(socket);
            let config = { ...data };
            if (data.id && !data.passhash && !data.apiToken) {
                const row = await R.findOne("prtg_server", "id = ?", [data.id]);
                if (row) {
                    config.username = config.username || row.username;
                    config.passhash = config.passhash || row.passhash;
                    config.apiToken = config.apiToken || row.api_token;
                }
            }
            const client = createPrtgClient({
                url: config.url,
                username: config.username,
                passhash: config.passhash,
                apiToken: config.apiToken,
                useApiToken: !!config.useApiToken,
                ignoreSsl: !!config.ignoreSsl,
            });
            const status = await client.getStatus();
            callback({ ok: true, version: status && status.Version });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("prtgListSensors", async (serverId, callback) => {
        try {
            checkLogin(socket);
            const row = await R.findOne("prtg_server", "id = ?", [serverId]);
            if (!row) {
                throw new Error("PRTG server not found");
            }
            const client = createPrtgClient({
                url: row.url,
                username: row.username,
                passhash: row.passhash,
                apiToken: row.api_token,
                useApiToken: !!row.use_api_token,
                ignoreSsl: !!row.ignore_ssl,
            });
            const data = await client.getSensors();
            callback({ ok: true, sensors: (data && data.sensors) || [] });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });
};
