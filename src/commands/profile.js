const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const noblox = require('noblox.js'); // Import noblox.js

const linkedUsersFilePath = './linkedusers.json';

let linkedUsers = [];
if (fs.existsSync(linkedUsersFilePath)) {
    const data = fs.readFileSync(linkedUsersFilePath, 'utf8');
    linkedUsers = JSON.parse(data);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Display your Discord and Roblox profile information.')
        .addUserOption(option => option.setName('target').setDescription('Select a user to view their profile')),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;
        const targetId = targetUser.id;

        const discordAccountAge = Math.floor((Date.now() - targetUser.createdAt) / (1000 * 60 * 60 * 24)); // in days
        const discordJoinedAt = interaction.guild.members.cache.get(targetId)?.joinedAt || new Date();
        
        const discordEmbed = new EmbedBuilder()
            .setTitle(`${targetUser.username}'s Profile`)
            .addFields(
                { name: 'Discord ID', value: targetId, inline: true },
                { name: 'Username', value: targetUser.username, inline: true },
                { name: 'Account Age (Days)', value: discordAccountAge.toString(), inline: true },
                { name: 'Date Joined Server', value: discordJoinedAt.toUTCString(), inline: true }
            );

        const linkedUser = linkedUsers.find(user => user.discordId === targetId);
        if (linkedUser) {
            const robloxId = linkedUser.robloxId;

            try {
                const robloxUserData = await noblox.getPlayerInfo(robloxId);

                const robloxUsername = robloxUserData.name;
                const totalGroups = robloxUserData.groups ? robloxUserData.groups.length : 0;
                const totalFriends = robloxUserData.friends ? robloxUserData.friends.length : 0;

                const robloxJoinDate = new Date(robloxUserData.joinDate);
                const robloxAccountAgeDays = Math.floor((Date.now() - robloxJoinDate.getTime()) / (1000 * 60 * 60 * 24));
                const robloxAccountAgeYears = Math.floor(robloxAccountAgeDays / 365);
                const robloxAccountAgeMonths = Math.floor((robloxAccountAgeDays % 365) / 30);

                const favoriteGames = robloxUserData.favoriteGames && Array.isArray(robloxUserData.favoriteGames) 
                    ? robloxUserData.favoriteGames.join(', ') 
                    : 'None';

                discordEmbed.addFields(
                    { name: 'Linked Roblox Username', value: robloxUsername, inline: true },
                    { name: 'Linked Roblox ID', value: robloxId.toString(), inline: true },
                    { name: 'Total Groups', value: totalGroups.toString(), inline: true },
                    { name: 'Total Friends', value: totalFriends.toString(), inline: true },
                    { name: 'Account Age (Days)', value: `${robloxAccountAgeYears} years, ${robloxAccountAgeMonths} months`, inline: true },
                    { name: 'Favorite Games', value: favoriteGames, inline: true }
                );

            } catch (error) {
                console.error(`[ERROR] Failed to fetch Roblox data for user ID ${robloxId}: ${error.message}`);
                discordEmbed.addFields(
                    { name: 'Error fetching Roblox data', value: 'Please check if the account exists or try again later.', inline: false }
                );
            }
        } else {
            const linkButton = new ButtonBuilder()
                .setCustomId('link_account')
                .setLabel('Link Roblox Account')
                .setEmoji('<:link:1289605385950593186>')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(linkButton);
            discordEmbed.addFields(
                { name: `<@${targetUser.username}> has not linked their Roblox account.`, value: 'Use `/link` to start linking.', inline: false }
            );

            await interaction.reply({ embeds: [discordEmbed], components: [row] });
            return;
        }

        await interaction.reply({ embeds: [discordEmbed] });
    }
};

async function handleButtonInteraction(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'link_account') {
        await interaction.reply({ content: 'Dashboard is in Development', ephemeral: true });
    }
}

module.exports.handleButtonInteraction = handleButtonInteraction;
