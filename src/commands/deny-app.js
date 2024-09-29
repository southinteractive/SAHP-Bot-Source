const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deny-app')
        .setDescription('Deny the target\'s application')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to deny.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for denial.')
                .setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        const denyintuser = interaction.user;
        const guild = interaction.guild;

        const appReaderRoleId = process.env.APPLICATION_READER_ROLE;
        const trooperInTrainingRoleId = process.env.TROOPER_IN_TRAINING_ROLE;
        const appResultsChannelId = process.env.APPLICATION_RESULTS_CHANNEL;
        const appLogsChannelId = process.env.APP_LOGS_CHANNEL;

        if (!interaction.member.roles.cache.has(appReaderRoleId)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const member = guild.members.cache.get(target.id);
        if (!member) {
            return interaction.reply({
                content: 'The specified user is not a member of this guild.',
                ephemeral: true
            });
        }

        const trooperRole = guild.roles.cache.get(trooperInTrainingRoleId);
        if (!trooperRole) {
            return interaction.reply({
                content: 'Trooper-in-Training role not found. Please check your configuration.',
                ephemeral: true
            });
        }

        if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: 'I do not have permission to assign roles. Please ensure I have the "Manage Roles" permission.',
                ephemeral: true
            });
        }

        try {
            const dmEmbedBody = new EmbedBuilder()
                .setTitle('<:sahp:1289307166104227943> Application Results Posted')
                .setDescription(`Dear ${target},\n Our Application Reader team recently posted your result for the San Andreas Highway Patrol Entry Application.`)
                .addFields(
                    { name: 'Reapplication Rules', value: 'Please understand that if you have failed, you will need to wait **48 hours** before you can reapply. Failure to meet this requirement will automatically deny your application.' }
                )
                .setColor('Blue')
                .setFooter({ text:`SAHP Automation | V0.2`});

            await target.send({ embeds: [dmEmbedBody] });

        } catch (error) {
            console.error('[ERROR] Failed to send DM', error);
            return interaction.reply({
                content: `I was unable to send a DM to ${target.tag}. Please check if the user has their DMs enabled.`,
                ephemeral: true
            });
        }

        const appResultsChannel = guild.channels.cache.get(appResultsChannelId);
        if (!appResultsChannel) {
            return interaction.reply({
                content: 'Application Results channel not found. Please check your configuration.',
                ephemeral: true
            });
        }

        const appResultEmbed = new EmbedBuilder()
            .setTitle('<:sahp:1289307166104227943> Application Results')
            .setDescription(`Dear ${target},\n\nUnfortunately, your application for the San Andreas Highway Patrol has not been successful at this time. I understand that this news may be disappointing, but I encourage you to consider reapplying after a 48-hour waiting period. \n\nDuring this time, I strongly advise against seeking answers from others, as doing so will result in a blacklist from the department. Additionally, please note that reapplying before the 48-hour window will result in an automatic denial of your application. \n\nIf you are looking for guidance on how to improve your application, feel free to take a screenshot of this message and submit a request via create-a-ticket. I will be happy to assist you there with helpful tips and advice for your next attempt.`)
            .setImage('https://cdn.discordapp.com/attachments/1288197023660642386/1289606877272997908/image.png?ex=66f96f7f&is=66f81dff&hm=ce7dfedbcc16954ae15268e1f01394669c47f074cb6d4d87fe1bf13958117762&')
            .setFields(
                   { name: 'Reason for Denial: ', value: `${reason}`}
                
            )
            .setColor(0xFF0000) 
            .setFooter({ text: 'Best regards,\nApplication Reader Team' })
            .setTimestamp();

        await appResultsChannel.send({ embeds: [appResultEmbed] });


        const appLogsChannel = guild.channels.cache.get(appLogsChannelId);
        if (appLogsChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('<:sahp:1289307166104227943> Application Denied')
                .setDescription('Details about the recent denial of the application.')
                .addFields(
                    { name: 'Denied User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: 'Denial Reason', value: reason || 'No additional comments.', inline: true },
                    { name: 'Denied by', value: `${denyintuser} (${denyintuser.id})`, inline: true }
                )
                .setColor(0xFF0000) // Changed to red for denial
                .setFooter({ text: 'SAHP Automation | V0.2' })
                .setTimestamp();

            await appLogsChannel.send({ embeds: [logEmbed] });
        }


        await interaction.reply({
            content: `Successfully denied ${target.tag}. They have been notified via DM.`,
            ephemeral: true
        });
    },
};
