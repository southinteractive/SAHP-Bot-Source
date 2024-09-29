const { CommandInteraction, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const blacklistedFilePath = path.join(__dirname, '..', '..', 'src/database/blacklisted.json');

module.exports = {
    data: {
        name: 'view-blacklist',
        description: 'View blacklist information of a specified user.',
        options: [
            {
                type: 6, 
                name: 'target',
                description: 'The user whose blacklist information you want to view.',
                required: true,
            },
        ],
    },
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        const iaRole = interaction.guild.roles.cache.find(role => role.name === 'Internal Affairs'); // change to actual ia role name
        if (!interaction.member.roles.cache.has(iaRole?.id)) {
            return await interaction.reply({
                content: "<:sahp:1289307166104227943> You do not have the required **Internal Affairs** permissions to use this command.",
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('target');

        if (!fs.existsSync(blacklistedFilePath)) {
            return await interaction.reply({ content: 'No blacklist data found.', ephemeral: true });
        }

        let blacklistedData;
        try {
            const fileData = fs.readFileSync(blacklistedFilePath);
            blacklistedData = JSON.parse(fileData);

            if (!Array.isArray(blacklistedData)) {
                return await interaction.reply({ content: 'Invalid blacklist data.', ephemeral: true });
            }
        } catch (err) {
            console.error('Error reading or parsing blacklisted.json:', err);
            return await interaction.reply({ content: 'Error retrieving blacklist data.', ephemeral: true });
        }

        const blacklistEntry = blacklistedData.find(entry => entry.userId === targetUser.id);

        if (!blacklistEntry) {
            return await interaction.reply({ content: `${targetUser.tag} is not blacklisted.`, ephemeral: true });
        }

        const blacklistDate = new Date(blacklistEntry.timestamp).toLocaleDateString();

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('<:sahp:1289307166104227943> Blacklist Information                     BLACKLIST ID: `XXXX`')
            .addFields([
                { name: '`Username`:', value: `> *${blacklistEntry.username}*`, inline: false },
                { name: '`Reason`:', value: `> *${blacklistEntry.reason}*`, inline: false },
                { name: '`Blacklist Date`:', value: `> *${blacklistDate}*`, inline: false },
                { name: '`Duration`:', value: `> *${blacklistEntry.duration}*`, inline: false },
                { name: '`Appealable`:', value: `${blacklistEntry.appealable ? '> **Yes**' : '> **No**'}`, inline: false },
            ])
            .setFooter({ text: 'San Andreas Highway Patrol - Internal Affairs' });

        // Respond with the embed
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
