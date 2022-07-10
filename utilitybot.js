const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const pvp = require("mineflayer-pvp").plugin;
const armorManager = require("mineflayer-armor-manager");

const GoalFollow = goals.GoalFollow;
const GoalBlock = goals.GoalBlock;
const version = "1.18.1";

const bot = mineflayer.createBot({
  host: "localhost", // IP from Server
  port: 51177, // Port for the Server
  username: "TestMachine",
  version: 1.18, //Minecraft Version that you like to use
});

bot.loadPlugin(pvp);
bot.loadPlugin(armorManager);
bot.loadPlugin(pathfinder);

let shortcut = "b.";
let tool;
let mineBlock;
let player;
let enemy;
let target;
let job;
let enabledChat = true;

bot.on("spawn", () => {
  const mcData = require("minecraft-data")(bot.version);
  let movements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(movements);
});

bot.on("chat", (username, message) => {
  if (username === bot.username) return;

  let mensagem = message.split(" ");

  if (mensagem[0] === shortcut) {
    switch (mensagem[1]) {
      case "hi":
        bot.chat("Hello Master, what's my assignement?");
        break;

      case "help":
        bot.chat("O que você precisa meu nobre?");
        break;

      case "follow":
        if (mensagem[2] === "me") {
          player = bot.players[username];
          job = 1;
          follow(player, job);
        } else {
          if (bot.players[mensagem[2]]) {
            player = bot.players[mensagem[2]];
            job = 1;
            follow(player, job);
          }
          bot.chat("Nao acho o player");
        }
        break;

      case "attack":
        if (bot.players[mensagem[2]]) {
          enemy = bot.players[mensagem[2]];
          job = 2;
        } else if (mensagem[1] === "me") {
          enemy = bot.players[username];
          job = 2;
        }

        if (enemy && job) follow(enemy, job);

        break;

      case "kill":
        if (mensagem[2]) {
          target = mensagem[2];
        }
        break;

      case "chat":
        enabledChat = !enabledChat;

        if (enabledChat) {
          bot.chat("bot's chat enable");
        } else {
          bot.chat("bot's chat disable");
        }
        break;

      case "stop":
        interrupt();
        break;

      case "shortcut":
        if (mensagem[2]) shortcut = mensagem[2];
        break;

      case "reset":
        shortcut = "b.";
        break;

      case "mine":
        blockToMine(mensagem[2]);
        break;
    }
  }
});

bot.on("physicTick", () => {
  if (bot.pvp.target) return;
  if (bot.pathfinder.isMoving()) return;

  const entity = bot.nearestEntity();
  if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0));
});

bot.on("physicTick", () => {
  if (target) {
    const filter = (e) =>
      e.type === "mob" &&
      e.mobType === target &&
      e.position.distanceTo(bot.entity.position) < 16 &&
      e.mobType !== "Armor Stand";

    let mob = bot.nearestEntity(filter);
    bot.pvp.attack(mob);
  }
});

async function cosmicLooper() {
  setInterval(() => {
    switch (job) {
      case 2:
        if (target.entity.position.distanceTo(bot.entity.position) > 50)
          interrupt();
        break;
    }
  }, 5000);
}

async function follow(target) {
  if (!target.entity || !target) {
    bot.chat("Esse poha ta muito longe");
    bot.pvp.stop();
    return;
  }

  chat();

  const goal = new GoalFollow(target.entity, 1);

  bot.pathfinder?.setGoal(goal);

  if (
    job === 1 &&
    bot.entity?.position.distanceTo(target.entity?.position) < 1
  ) {
    interrupt();
  } else if (job === 2) {
    const Sword = bot.inventory
      .items()
      .find((item) => item.name.includes("sword"));
    if (Sword && tool != Sword) {
      bot.unequip(tool);
      tool = Sword;
      bot.equip(tool, "hand");
    }
    bot.lookAt(target.entity.position.offset(0, target.height, 0), true, () => {
      bot.pvp.attack(target.entity);
    });
  }
}

async function interrupt() {
  enemy = null;
  target = null;
  job = null;
  bot.pathfinder.setGoal(null);
  bot.pvp.stop();
}

function chat() {
  if (enabledChat) {
    if (job === 1) {
      bot.chat("On my way");
    } else if (job === 2) {
      bot.chat("I'm your hitman ");
    } else if (job === 3) {
      bot.chat(`I'm the exterminator of ${target}`);
    }
  }
}

function blockToMine(block) {
  const mcData = require("minecraft-data")(bot.version);
  const movements = new Movements(bot, mcData);
  movements.scafoldingBlocks = [];
  bot.pathfinder.setMovements(movements);

  const pickaxe = bot.inventory
    .items()
    .find((item) => item.name.includes("pickaxe"));

  if (pickaxe && tool != pickaxe) {
    bot.unequip(tool);
    tool = pickaxe;
    bot.equip(pickaxe, "hand");
  }

  if (!mineBlock) {
    mineBlock = bot.findBlock({
      matching: mcData.blocksByName[block].id,
      maxDistance: 100,
    });
  }

  const x = mineBlock?.position.x;
  const y = mineBlock?.position.y;
  const z = mineBlock?.position.z;

  const goal = new GoalBlock(x, y, z);
  bot.pathfinder.setGoal(goal);

  bot.chat(`Give me a pickaxe to mine`);
}

// Equip Items

// bot.on('playerCollect', (collector, itemDrop) => {
//   if (collector !== bot.entity) return

//   setTimeout(() => {
//     const sword = bot.inventory.items().find(item => item.name.includes('sword'))

//     if (sword) {
//       tool = sword
//       bot.equip(sword, 'hand')
//     }
//   }, 250)
// })

// bot.on('playerCollect', (collector, itemDrop) => {
//   if (collector !== bot.entity) return

//   setTimeout(() => {
//     const pickaxe = bot.inventory.items().find(item => item.name.includes('pickaxe'))

//     console.log(pickaxe)

//     if (pickaxe) {
//       tool = pickaxe
//       bot.equip(pickaxe, 'hand')
//     }
//   }, 250)
// })

bot.on("playerCollect", (collector, itemDrop) => {
  if (collector !== bot.entity) return;

  setTimeout(() => {
    const shield = bot.inventory
      .items()
      .find((item) => item.name.includes("shield"));
    if (shield) bot.equip(shield, "off-hand");
  }, 250);
});
