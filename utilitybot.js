const mineflayer = require('mineflayer');
const {pathfinder, Movements, goals} = require('mineflayer-pathfinder') 
const vec3 = require('vec3')

const GoalFollow = goals.GoalFollow

const bot = mineflayer.createBot({  
  host:'localhost',  // IP from Server             
  port:57889, // Port for the Server
  username:"TestMachine",
  version:1.17 //Minecraft Version that you like to use
})

bot.loadPlugin(pathfinder)

let player;
let enemy;
let target;
let job;

bot.on('spawn',()=>{
  const mcData = require('minecraft-data')(bot.version) 
  const movements = new Movements(bot, mcData)
  bot.pathfinder.setMovements(movements)
  movements.scafoldingBlocks = [mcData.blocksByName.granite.id]
})

bot.on('chat',(username,message)=> {
  if(username === bot.username) return;

  let mensagem = message.split(' ')

  switch(mensagem[0]){

    case 'oi':
      bot.chat('Iae meu brother, manda o job pra mim fazer')
      console.log(bot.players['Muiloco3'])
      break;

    case 'help':
        bot.chat('O que você precisa meu nobre?')
      break;

    case 'follow':
      if(mensagem[1] === 'me') {
        player = bot.players[username]
        job = 1
        follow(player,job)
        return;
      } else {

        if(bot.players[mensagem[1]]){
          player = bot.players[mensagem[1]]
          job = 1
          follow(player,job)

          return;
        }
        bot.chat('Nao acho o player')
      } 
        break;

    case('attack'):
      if(bot.players[mensagem[1]]){
        player = bot.players[mensagem[1]]
        job = 2
        follow(player,job)
      } else {
        bot.chat('Nao existe esse player')
      }

      break;


      case 'kill':
        if(mensagem[1]){
          let mobCicle = setInterval(()=>{
            let mobFilter = e => e.type === 'mob' && e.mobType === mensagem[1]
            target = bot.nearestEntity(mobFilter)
            
            if(!target){
              bot.chat('Não existe esse mob')
              clearInterval(mobCicle);
              return;
            }

            if(bot.entity.position.distanceTo(target.position) > 6) clearInterval(mobCicle);
          
            bot.lookAt(target.position.offset(0,target.height,0),true,() =>{
              bot.attack(target)
              
            })
          },1000)
        } 
  }
})

async function follow(target,job){

  if(!target.entity || !target) {
    bot.chat('Esse poha ta muito longe')
    return;
  } else {
    bot.chat('é pra ja meu nobre')
  }

  const goal = new GoalFollow(target.entity,1) 

  bot.pathfinder?.setGoal(goal)

  if(job === 1){
    if(bot.entity?.position.distanceTo(target.entity?.position) < 2) bot.pathfinder.setGoal(null)
  } else if (job === 2){
    let attackInterval = setInterval(() =>{
      bot.lookAt(target.entity?.position.offset(0,target.height,0),true, ()=>{
        if(bot.entity.position.distanceTo(target.entity.position < 2)) bot.attack(target)
      })
    },1000)
  }
}







