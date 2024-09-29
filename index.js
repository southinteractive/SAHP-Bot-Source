
const {
    Client, GatewayIntentBits, Partials, Collection, Events,
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');
const noblox = require('noblox.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();
const { TOKEN, SAHP_GROUP_ID, ROBLOX_COOKIE, guildId, clientid } = process.env;

const blacklistedFilePath = path.join(__dirname, 'dashboard', 'blacklisted.json');
const approvedApplicationsFilePath = path.join(__dirname, 'dashboard', 'approvedApplications.json');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});


client.commands = new Collection();


const colorCodes = {
    ERROR: '\x1b[31m',  // Red
    INFO: '\x1b[33m',   // Yellow
    WARN: '\x1b[35m',   // Purple
    COMMAND: '\x1b[34m', // Blue
    USERNAME: '\x1b[35m' // Purple for username
};
const reset = '\x1b[0m'; 

/**
 * @param {string} type - The type of log (INFO, ERROR, WARN, COMMAND)
 * @param {string} message - The message to log
 */
function logWithColor(type, message) {
    console.log(`[${type}] ${colorCodes[type] || ''}${message}${reset}`);
}

/**
 * Reads and returns the total number of blacklisted users from blacklisted.json.
 * @returns {number} Total number of blacklisted users.
 */
function getBlacklistedCount() {
    if (fs.existsSync(blacklistedFilePath)) {
        const blacklistedData = JSON.parse(fs.readFileSync(blacklistedFilePath, 'utf-8'));
        return blacklistedData.length;
    }
    return 0;
}

/**
 * Reads and returns the number of approved applications from approvedApplications.json.
 * @returns {number} Number of approved applications.
 */
function getApprovedApplicationsCount() {
    if (fs.existsSync(approvedApplicationsFilePath)) {
        const approvedData = JSON.parse(fs.readFileSync(approvedApplicationsFilePath, 'utf-8'));
        return approvedData.approvedCount || 0; // Assuming approvedCount is a field in approvedApplications.json
    }
    return 0;
}

async function loadCommands() {
    const commandsPath = path.join(__dirname, 'src', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    let totalCommands = 0; // Initialize command count

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));

        if (command.data && command.data.name && typeof command.execute === 'function') {
            client.commands.set(command.data.name, command);
            totalCommands++; // Increment command count
        } else {
            logWithColor('WARN', `Warning: The command at '${file}' is missing 'data' or 'execute' property.`);
        }
    }

    logWithColor('INFO', `Total loaded commands: ${totalCommands}`);
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const username = `${colorCodes.USERNAME}${interaction.user.username}${reset}`;
    logWithColor('COMMAND', `Command run: /${interaction.commandName} by ${username}`);

    try {
        await command.execute(interaction, client);
    } catch (error) {
        logWithColor('ERROR', `Error executing command: /${interaction.commandName}`);
        console.error(error); // Print full error stack
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    const welcomeChannelId = '1288595256689950741'; // Replace with sahp welcome channel ID
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

    if (!welcomeChannel) return;

    // welcome embed
    const welcomeEmbed = new EmbedBuilder()
        .setTitle('> <:sahp:1289307166104227943> San Andreas Highway Patrol')
        .setDescription(`> Dear ${member}, \n> welcome to the San Andreas Highway Patrol,\n> Should you desire to apply for the esteemed role of SAHP trooper,\n> we kindly invite you to proceed to <#1270561764450242606> and complete the application provided.\n\n> To ensure a harmonious and respectful environment for all members, we emphasize the importance of adhering to the ⁠rules outlined in ⁠rules.\n> Compliance with these guidelines is essential to prevent the possibility of permanent suspension from the server.`)
        .setColor('#0099ff')
        .setImage('https://cdn.discordapp.com/attachments/1288595256689950741/1289306525613031486/3262d34e620319406225279f974a47071.png')
        .setFooter({ text: 'SAHP Automation | V0.2' })
        .setTimestamp();

    const buttonRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('view_chainofcommand')
                .setLabel('Chain of Command')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('server_guidelines')
                .setLabel('Server Guidelines')
                .setStyle(ButtonStyle.Secondary)
        );

    await welcomeChannel.send({ embeds: [welcomeEmbed], components: [buttonRow] });
});


client.on(Events.GuildMemberAdd, async (member) => {
    try {
        const blacklistedData = fs.existsSync(blacklistedFilePath) ? JSON.parse(fs.readFileSync(blacklistedFilePath, 'utf-8')) : [];

        const isBlacklisted = blacklistedData.find(entry => entry.userId === member.id);
        if (isBlacklisted) {
            const blacklistedRole = member.guild.roles.cache.find(role => role.name === 'Blacklisted');
            if (blacklistedRole) {
                await member.roles.add(blacklistedRole);
            }
        }
    } catch (error) {
        logWithColor('ERROR', `Failed to assign blacklisted role: ${error.message}`);
    }
});

// Bot ready event
client.once('ready', async () => {
    console.clear();
    // loadding screen

    const loadingText = 'Loading Database';
    let dots = '';
    const loadingInterval = setInterval(() => {
        dots = dots.length < 3 ? dots + '.' : '';
        process.stdout.write(`\r${loadingText}${dots} `);
    }, 500); // updates every 500 milisconds


    setTimeout(() => {
        clearInterval(loadingInterval);
        console.clear(); 

        const totalBlacklisted = getBlacklistedCount();

        const totalApprovedApplications = getApprovedApplicationsCount();

        // Log successful connection and data
        logWithColor('INFO', 'Connecting to Dashboard...');
        setTimeout(() => {
            logWithColor('INFO', 'Connected with SAHP-Automation!');
            logWithColor('INFO', `Overseeing: ${totalBlacklisted} blacklisted users.`);
            logWithColor('INFO', `Total applications approved: ${totalApprovedApplications}`);
        }, 2000); 
    }, 5000); 

    await loadCommands();
});


(async () => {
    try {
        await noblox.setCookie(ROBLOX_COOKIE); // Ensure Noblox is authenticated
        logWithColor('INFO', 'Noblox authenticated successfully!');
        client.login(TOKEN); // Login to Discord
    } catch (error) {
        logWithColor('ERROR', `Failed to authenticate Noblox: ${error.message}`);
        process.exit(1); // Exit if Noblox authentication fails
    }
})();
