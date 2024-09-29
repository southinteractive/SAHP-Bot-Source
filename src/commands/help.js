const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const guild = {}

whiteline = '<:b_white_line:1289670141981884416>'

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all commands available for your permissions'),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor('#00FF00') 
            .setThumbnail(client.user.avatarURL())
            .setTitle(`SAHP Automation | Commands`)
            .setDescription('All available commands within the San Andreas Highway Patrol Bot \n<:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416><:b_white_line:1289670141981884416>\n> Category: **Account Linking**\n> `/link` - *Allows you to link your roblox account to the SAHP Bot*\n> `/unlink` - *Unlinks your roblox account with the SAHP Bot*\n> `/profile` -  *View the targets Discord & Roblox profile AIO*\n\n> Category: **Application Management**\n> `/approve-app` - *Approves the targets application*\n> `/deny-app` - *Denies the targets application*\n\n> Category: **[IA] SAHP Management**\n> `/blacklist` - *Blacklists the target from SAHP*\n> `/unblacklist` -  Unblacklists the target and removes him from the Database*\n> `/view-blacklist` -  *Shows you the details about the targets Blacklist*\n\n> Category: **Other Commands**\n> `/credits` -  *Shows you the developer of the SAHP Bot*')
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
