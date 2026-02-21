import {readConfig,setUser} from "./config.js";

import {
  commandsRegistry,
  registerCommand,
  runCommand,
  handlerLogin,
  handlerRegister,
  handlerReset,
    handleUsers,
    handlerAgg,
    handlerAddFeed,
    handlerFeeds,
    handlerFollow,
    handlerFollowing,
    middlewareLoggedIn,
    handlerUnfollow,
    handlerBrowse
} from "./commands";
async function main() {
    const registry:commandsRegistry={};
    registerCommand(registry,"login",handlerLogin);
    registerCommand(registry,"register",handlerRegister);
    registerCommand(registry,"reset",handlerReset);
    registerCommand(registry,"users",handleUsers);
    registerCommand(registry,"agg",handlerAgg);
    registerCommand(registry,"feeds",handlerFeeds);
    registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
    registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
    registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
    registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));
    registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));


    const args = process.argv.slice(2);
    if(args.length===0){
        console.error("Not enough arguments");
        process.exit(1);
    }
    const cmdName=args[0];
    const cmdArgs=args.slice(1);
    try{
        await runCommand(registry,cmdName,...cmdArgs);
        process.exit(0);
    } catch(e: any){
        console.error(e.message);
        process.exit(1);
    }

}

main();