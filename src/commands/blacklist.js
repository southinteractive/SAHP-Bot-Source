const { CommandInteraction, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const blacklistedFilePath = path.join(__dirname, '..', '..', 'src/database/blacklisted.json');

module.exports = {
    data: {
        name: 'blacklist',
        description: 'Blacklist a user with a specified reason, duration, and appeal status.',
        options: [
            {
                type: 6, 
                name: 'target',
                description: 'The user to blacklist',
                required: true,
            },
            {
                type: 3, 
                name: 'reason',
                description: 'Reason for blacklisting',
                required: true,
            },
            {
                type: 3, 
                name: 'duration',
                description: 'Duration of the blacklist (e.g., "1d", "2h", "3w").',
                required: true,
            },
            {
                type: 5, 
                name: 'appealable',
                description: 'Is the blacklist appealable?',
                required: true,
            },
        ],
    },
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        const iaRole = interaction.guild.roles.cache.find(role => role.name === 'Internal Affairs');
        if (!interaction.member.roles.cache.has(iaRole.id)) {
            return await interaction.reply({ content: "<:sahp:1289307166104227943> You do not have the required **Internal Affairs** permissions to use this command.", ephemeral: true });
        }

        const targetUser = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getString('duration');
        const appealable = interaction.options.getBoolean('appealable');


        let blacklistedData = [];
        if (fs.existsSync(blacklistedFilePath)) {
            try {
                const fileData = fs.readFileSync(blacklistedFilePath);
                blacklistedData = JSON.parse(fileData);

                if (!Array.isArray(blacklistedData)) {
                    blacklistedData = [];
                }
            } catch (err) {
                console.error('Error reading or parsing blacklisted.json:', err);
                blacklistedData = []; 
            }
        }

        const blacklistEntry = {
            userId: targetUser.id,
            username: targetUser.tag,
            reason,
            duration,
            appealable,
            timestamp: Date.now(),
        };
        blacklistedData.push(blacklistEntry);
        fs.writeFileSync(blacklistedFilePath, JSON.stringify(blacklistedData, null, 2));

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('<:sahp:1289307166104227943> Important Notification                                         Blacklist ID: `#XXXX`')
            .setDescription(`> Dear ${targetUser},\n> you have been **blacklisted** from the San Andreas Highway Patrol due to the following reason:`)
            .setFooter({ text: `Signed,\nInternal Affairs` })
            .addFields([
                { name: 'Reason: ', value: `> *${reason}*`, inline: true},
                { name: 'Duration: ', value: `> *${duration}*`, inline: true},
                { name: 'Appealable: ', value:`> *${appealable}*`, inline: true},
                { name: 'Additional Information: ', value:'> *We take these issues **seriously** to keep our department safe and **respectful** for everyone. If you think this decision was a **mistake** or want to **appeal** your blacklist, please contact the SAHP Internal Affairs via Support Tickets.*'}
            ]);

        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        await targetMember.send({ embeds: [embed] }).catch(err => console.error(`I could not notify ${targetUser}:`, err));

        const blacklistedRole = interaction.guild.roles.cache.find(role => role.name === 'Blacklisted'); // Enter Blacklisted role name
        if (blacklistedRole) {
            await targetMember.roles.add(blacklistedRole);
        }

        const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'blacklist-logs');
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('<:sahp:1289307166104227943> User Blacklisted')
                .addFields([
                    { name: 'User', value: targetUser.tag, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Appealable', value: appealable ? 'Yes' : 'No', inline: true },
                ]);

            await logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.reply({ content: `<:sahp:1289307166104227943> You have successfully **blacklisted** ${targetUser.tag} for **Reason:** ${reason}.\n**Duration:** ${duration}\n**Appealable:** ${appealable ? 'Yes' : 'No'}`, ephemeral: true });
    },
};
