const { CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const blacklistedFilePath = path.join(__dirname, '..', '..', 'src/database/blacklisted.json');

module.exports = {
    data: {
        name: 'unblacklist',
        description: 'Unblacklist a user from the blacklist.',
        options: [
            {
                type: 6, // USER type
                name: 'target',
                description: 'The user to unblacklist',
                required: true,
            },
            {
                type: 3, // STRING type
                name: 'note',
                description: 'Reason for unblacklisting',
                required: false,
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
        const unblacklistReason = interaction.options.getString('note') || 'No reason provided.';

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

        const blacklistIndex = blacklistedData.findIndex(entry => entry.userId === targetUser.id);
        if (blacklistIndex === -1) {
            return await interaction.reply({ content: `${targetUser.tag} is not blacklisted.`, ephemeral: true });
        }

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirmUnblacklist')
            .setLabel('Confirm Unblacklist')
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancelUnblacklist')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        await interaction.reply({
            content: `Are you sure you want to unblacklist **${targetUser.tag}**?`,
            components: [row],
            ephemeral: true,
        });

        const filter = i => i.customId === 'confirmUnblacklist' || i.customId === 'cancelUnblacklist' && i.user.id === interaction.user.id;

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'confirmUnblacklist') {
                // Remove the user from the blacklist
                blacklistedData.splice(blacklistIndex, 1);
                fs.writeFileSync(blacklistedFilePath, JSON.stringify(blacklistedData, null, 2));

                const targetMember = await interaction.guild.members.fetch(targetUser.id);
                const blacklistedRole = interaction.guild.roles.cache.find(role => role.name === 'Blacklisted');
                if (blacklistedRole) {
                    await targetMember.roles.remove(blacklistedRole);
                }


                const notifyEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Unblacklisted')
                    .setDescription(`> Dear ${targetUser.tag},\n\n> we are pleased to inform you that you have been **unblacklisted**. We kindly ask that you refrain from any actions that led to your **previous** blacklist, as our priority is to maintain a safe and **professional** environment **within our department**. \n\n> **Note from IA**: ${unblacklistReason}\n\nWelcome back, future **trooper**.`)
                    .setFooter({ text: `Signed,\nInternal Affairs` })

                await targetMember.send({ embeds: [notifyEmbed] }).catch(err => console.error(`Could not notify ${targetUser}:`, err));

                const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'blacklist-logs');
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('<:sahp:1289307166104227943> User Unblacklisted')
                        .setDescription('Target has been informed about the removal from the blacklist; he has been taken off the blacklisted database and removed from the blacklisted role')
                        .setFooter( {text: 'SAHP Automation | V0.2'})
                        .addFields([
                            { name: '`User`', value: targetUser.tag, inline: true },
                            { name: '`Action By`', value: interaction.user.tag, inline: true },
                            { name: '`Note`', value: unblacklistReason, inline: true },
                        ]);

                    await logChannel.send({ embeds: [logEmbed] });
                }

                await i.update({ content: `You have successfully **unblacklisted** ${targetUser.tag}.`, components: [] });
            } else if (i.customId === 'cancelUnblacklist') {
                await i.update({ content: 'Unblacklist action has been canceled.', components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'You did not respond in time. The unblacklist action has been canceled.', ephemeral: true });
            }
        });
    },
};
