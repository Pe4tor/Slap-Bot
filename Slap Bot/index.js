const Discord = require('discord.js');
const { prefix, token, modrole, slaps, slapself, slapText } = require('./config.json');
 const client = new Discord.Client({ws: {intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES']}});
 const SQLite = require("better-sqlite3");
const { Integer } = require('better-sqlite3');
 const sql = new SQLite('./slaps.sqlite');
 const sql2 = new SQLite('./slappers.sqlite');
 const gifs = `${slaps}`;
 const file = new Discord.MessageAttachment('../Slap Bot/selfSlap.gif');


 



client.once('ready', () => {
 console.log(`Logged in as ${client.user.tag}!`);
 

 const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'slaps';").get();
    if (!table['count(*)']) {
        // If the table isn't there, create it and setup the database correctly.
        sql.prepare("CREATE TABLE slaps (id TEXT PRIMARY KEY, user TEXT, guild TEXT, slapcount INTEGER);").run();
        // Ensure that the "id" row is always unique and indexed.
        sql.prepare("CREATE UNIQUE INDEX idx_slaps_id ON slaps (id);").run();
        sql.pragma("synchronous = 1");
        sql.pragma("journal_mode = wal");
    }

    // And then we have two prepared statements to get and set the score data.
    client.getScore = sql.prepare("SELECT * FROM slaps WHERE user = ? AND guild = ?");
    client.setScore = sql.prepare("INSERT OR REPLACE INTO slaps (id, user, guild, slapcount) VALUES (@id, @user, @guild, @slapcount);");


 const table2 = sql2.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'slappers';").get();
    if (!table['count(*)']) {
      // If the table isn't there, create it and setup the database correctly.
      sql2.prepare("CREATE TABLE slappers (id TEXT PRIMARY KEY, user TEXT, guild TEXT, peopleSlapped INTEGER);").run();
      // Ensure that the "id" row is always unique and indexed.
      sql2.prepare("CREATE UNIQUE INDEX idx_slappers_id ON slappers (id);").run();
      sql2.pragma("synchronous = 1");
      sql2.pragma("journal_mode = wal");
    }

 // And then we have two prepared statements to get and set the score data.
    client.getSlapped = sql2.prepare("SELECT * FROM slappers WHERE user = ? AND guild = ?");
    client.setSlapped = sql2.prepare("INSERT OR REPLACE INTO slappers (id, user, guild, peopleSlapped) VALUES (@id, @user, @guild, @peopleSlapped);");


 });



client.on('message', msg => {
    if (!msg.content.startsWith(prefix) || msg.author.bot) return;
    //if (!msg.member.roles.cache.some((role) => role.name === `${modrole}`)) return


    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (msg.content === `${prefix}ping`){
         msg.channel.send('Pong!');
    }
    else if (msg.content.startsWith(`${prefix}slap`)){
        if (msg.author.bot) return;
        if (!msg.guild) return;
        if (!args.length) {
            //msg.channel.send(file=Discord.File(`${slapself}`));
            msg.channel.send(`Hah. Only an idiot would try to slap thin air.`)
            return;
        }
        //add a slap to tagged user
        var taggedUser = msg.mentions.users.first();
		if (taggedUser === undefined){
			msg.channel.send(`You thought I wasn't able to code in all the corner cases BUT I WAS HAHAHAHA`)
			return;
		}
		taggedUser = msg.mentions.users.first().id;
        const taggedUserDisplay = msg.mentions.users.first().username;
        let score = client.getScore.get(taggedUser, msg.guild.id);
        //If user is new, add them to the table
        if (!score) {
            score = {
              id: `${msg.guild.id}-${taggedUser}`,
              user: taggedUser,
              guild: msg.guild.id,
              slapcount: 0
            }
        }
        //Increment slap count
        score.slapcount++;
        var currentSlaps = (score.slapcount); //saving this for embed
        client.setScore.run(score);

        //add a slapper to the user who called the command
        const sender = msg.author.id;
        let slapped = client.getSlapped.get(sender, msg.guild.id);
        //If user hasn't slapped before, add them to the table
        if (!slapped) {
            slapped = {
                id: `${msg.guild.id}-${sender}`,
                user: sender,
                guild: msg.guild.id,
                peopleSlapped: 0
            }
        }
        //Increment slapper count
        slapped.peopleSlapped++;
        var currentSlapped = (slapped.peopleSlapped);
        client.setSlapped.run(slapped);
        //console.log(taggedUser);
        console.log(msg.author.username + " slapped " + taggedUserDisplay);


        //Choose random gif from array in config
        var gifToSend = slaps[Math.floor(Math.random() * slaps.length)];
        var gifSend = gifToSend + '.gif';
        //console.log(currentSlaps);
        var titleText = `You've been slapped by ${msg.author.username}!`;
        if (msg.author.id == taggedUser){
            titleText = 'A little weird but I won\'t judge';
            gifSend = 'https://imgur.com/BVq5OvM.gif';
        }
        //console.log(gifSend);

        const slapEmbed = {
            title: titleText,
            description: 'ouch!', 
            image: { url: gifSend},
            
            footer: {
                text: taggedUserDisplay + " has been slapped a total of " + currentSlaps.toString() + " times",
            },
            
        }

        msg.channel.send({embed: slapEmbed});
    }

    else if (msg.content.startsWith(`${prefix}topslaps`)){
        const top5 = sql.prepare("SELECT * FROM slaps WHERE guild = ? ORDER BY slapcount DESC LIMIT 5;").all(msg.guild.id);

        
        const embed = new Discord.MessageEmbed()
        .setTitle("Leaderboard?")
        .setAuthor(client.user.username, client.user.avatarURL())
        .setFooter(slapText[Math.floor(Math.random() * slapText.length)])
        //.setDescription("The slapped")
        .setColor(0x00AE86);
        
        var i = 1;
        var embedVal = '';
        for(const data of top5) {
            //console.log(client.users.cache.get(data.user));
            if (client.users.cache.get(data.user)!= undefined){
                //embed.addFields({ name: '', value:i +  `@${client.users.cache.get(data.user).tag}` + ' : ' +`${data.slapcount} slaps` });
                embedVal += i + '. ' + `${client.users.cache.get(data.user).tag}` + ' : ' +`${data.slapcount} slaps` + '\n';
            }
            i++;
        }

        const top5slappers = sql2.prepare("SELECT * FROM slappers WHERE guild = ? ORDER BY peopleSlapped DESC LIMIT 5;").all(msg.guild.id);
        var j = 1;
        var embedVal2 = '';
        for (const data of top5slappers){
            if (client.users.cache.get(data.user)!= undefined){
                embedVal2 += j + '. ' + `${client.users.cache.get(data.user).tag}` + ' : ' +`${data.peopleSlapped} slaps` + '\n';
            }
            j++;
        }

        embed.addFields({name: 'Top 5 most slapped', value: embedVal, inline: true}, {name: 'Top 5 slappers', value : embedVal2, inline : true});
        console.log(embedVal);
		console.log(embedVal2);
		return msg.channel.send({embed})
    }


 });

client.login(token);