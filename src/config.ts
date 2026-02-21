import fs from "fs";
import os from "os";
import path from "path";


type Config = {
  dbUrl: string;              
  currentUserName?: string;    
};

export function getConfigFilePath(): string {
    return path.join(os.homedir(), ".gatorconfig.json");
}

export function writeConfig(config: Config): void {
    const filePath = getConfigFilePath();
    const json = JSON.stringify({
    db_url: config.dbUrl,
    current_user_name: config.currentUserName,
  }, null, 2);
  fs.writeFileSync(filePath, json, "utf-8");
}
function validateConfig(rawConfig: any): Config {
  if (!rawConfig || typeof rawConfig.db_url !== "string") {
    throw new Error("Invalid config file");
  }
  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };
}
export function readConfig(): Config {
  const filePath = getConfigFilePath();
  const rawData = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(rawData);
  return validateConfig(parsed);
}

export function setUser(userName: string): void {
  const cfg=readConfig();
  cfg.currentUserName = userName;
  writeConfig(cfg);
}