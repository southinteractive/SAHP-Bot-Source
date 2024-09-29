const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('approve-app')
        .setDescription('Approve an application')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to approve.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Optional message to include in the approval.')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const message = interaction.options.getString('message') || 'No additional comments.';
        const approver = interaction.user;
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
                content: '<@&1288602471610056804> role not found. Please check your configuration.',
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
            await member.roles.add(trooperRole);
        
            const dmEmbedHeader = new EmbedBuilder()
                .setTitle('<:sahp:1289307166104227943> Application Results Posted')
                .setDescription(`Dear ${target},\nOur Application Reader team recently posted your result for the San Andreas Highway Patrol Entry Application.`)
                .addFields(
                    { name: 'Reapplication Rules', value: 'Please understand that if you have failed, you will need to wait **48 hours** before you can reapply. Failure to meet this requirement will automatically deny your application.' }
                )
                .setColor('#0000FF'); 
        
            await target.send({ embeds: [dmEmbedHeader] });
 

        } catch (error) {
            console.error('[ERROR] Failed to send DM or assign role:', error);
            return interaction.reply({
                content: `I was unable to assign the role or send a DM to ${target.tag}. Please check my permissions or if the user has DMs enabled.`,
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
            .setDescription(`Dear ${target},\n\nCongratulations on your acceptance into the San Andreas Highway Patrol, and welcome to the SAHP 1,000! During my review of your application, I was impressed with your qualifications and dedication. I believe that your background, skills, and unique perspective will greatly contribute to the department, and that your time with us will provide you with opportunities for growth, learning, and rewarding experiences.\n\nAt this time, you have been assigned the Trooper-in-Training role. To officially become a Probationary Trooper, please check the ⁠training-announcements channel for notifications regarding upcoming SAHP training sessions.\n\nReviewed and Approved by: ${approver}`)
            .setColor(0x00FF00)
            .setImage('https://cdn.discordapp.com/attachments/1288197023660642386/1289606877272997908/image.png?ex=66f96f7f&is=66f81dff&hm=ce7dfedbcc16954ae15268e1f01394669c47f074cb6d4d87fe1bf13958117762&')
            .setFooter({ text: 'Best regards,\nApplication Reader Team' })
            .setTimestamp();

        await appResultsChannel.send({ embeds: [appResultEmbed] });

        const appLogsChannel = guild.channels.cache.get(appLogsChannelId);
        if (appLogsChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('<:sahp:1289307166104227943> Application Approved')
                .setDescription('Details about the recent approval of APP-ID: `XXXX`')
                .addFields(
                    { name: 'Approved User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: 'Assigned Role', value: 'Trooper-in-Training', inline: true },
                    { name: 'Approval Message', value: message || 'No additional comments.', inline: true },
                    { name: 'Approved by', value: `${approver} (${approver.id})`, inline: true }
                )
                .setColor(0x00FF00)
                .setFooter({ text: 'SAHP Automation | V0.2' })
                .setTimestamp();

            await appLogsChannel.send({ embeds: [logEmbed] });
        }

        await interaction.reply({
            content: `<:sahp:1289307166104227943> Successfully approved ${target.tag}. They have been assigned the <@&1288602471610056804> role and notified via DM.`,
            ephemeral: true
        });
    },
};
