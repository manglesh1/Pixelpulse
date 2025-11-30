import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_CONTROLLER_URL;

export const restartPc = () => axios.post(`${BASE}/api/admin/restart-pc`);

export const restartApp = () => axios.post(`${BASE}/api/admin/restart-app`);

export const logout = () => axios.post(`${BASE}/api/admin/logout`);

export const updateSystem = () => axios.post(`${BASE}/api/admin/update`);

export const closeApp = () => axios.post(`${BASE}/api/admin/close`);

export const turnDoorOn = () => axios.post(`${BASE}/api/device/door/on`);

export const turnDoorOff = () => axios.post(`${BASE}/api/device/door/off`);

export const rescanControllers = () => axios.post(`${BASE}/api/device/scan`);

export const testScanner = () => axios.post(`${BASE}/scanner/test`);
