require('dotenv').config();
const { REST } = require('discord.js');
const { Routes } = require('discord-api-types/v9');

const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const commands = [
    {
        name: 'approve-app',
        description: 'Approve the target\'s application',
        options: [
            {
                type: 6, // USER type
                name: 'target',
                description: 'The user to approve.',
                required: true,
            },
            {
                type: 3, // STRING type
                name: 'message',
                description: 'Optional message to include in the approval.',
                required: false,
            },
        ],
    },
    {
        name: 'deny-app',
        description: 'Deny the target\'s application',
        options: [
            {
                type: 6, // USER type
                name: 'target',
                description: 'The user to deny.',
                required: true,
            },
            {
                type: 3, // STRING type
                name: 'reason',
                description: 'Reason for denial.',
                required: true,
            },
        ],
    },
    {
        name: 'blacklist',
        description: 'Blacklist a user with a specified reason, duration, and appeal status.',
        options: [
            {
                type: 6, // USER type
                name: 'target',
                description: 'The user to blacklist',
                required: true,
            },
            {
                type: 3, // STRING type
                name: 'reason',
                description: 'Reason for blacklisting',
                required: true,
            },
            {
                type: 3, // STRING type
                name: 'duration',
                description: 'Duration of the blacklist (e.g., "1d", "2h", "3w").',
                required: true,
            },
            {
                type: 5, // BOOLEAN type
                name: 'appealable',
                description: 'Is the blacklist appealable?',
                required: true,
            },
        ],
    },
    {
        name: 'link',
        description: 'Link your Roblox account to your Discord account.',
        options: [
            {
                type: 3, // STRING type
                name: 'username',
                description: 'Your Roblox username to link.',
                required: true,
            }
        ]
    },
    {
        name: 'profile',
        description: 'View Someones Profile',
        options: [
            {
                type: 6,
                name: 'target',
                description: 'Choose your Target',
                require: false,
            }
        ]
    },
    {
        name: 'credits',
        description: 'Shows the developers of the Bot'
    },
    {
        name: 'view-blacklist',
        description: 'View Someones Blacklist Information',
        options: [
            {
                type: 6,
                name: 'target',
                description: 'Chooce your Blacklisted Target',
                required: true
            }
        ]
    },
    {
        name:'help',
        description: 'Shows all commands with your permission',
    },
    {
        name: 'unblacklist',
        description: 'Unblacklists the target and removes him from the Database',
        options: [
            { 
                type: 6,
                name: 'target',
                description: 'Target you want to unblacklist',
                required: true
            },
            {
                type: 3,
                name: 'note',
                description: 'Addedntional Note for the logging',
                required: false
            }
        ]
    }


];

const rest = new REST({ version: '9' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
