const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const noblox = require('noblox.js');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');


const linkedUsersFilePath = '../linkedusers.json';

let linkedUsers = [];
if (fs.existsSync(linkedUsersFilePath)) {
    const data = fs.readFileSync(linkedUsersFilePath, 'utf8');
    linkedUsers = JSON.parse(data);
}

function saveLinkedUsers() {
    fs.writeFileSync(linkedUsersFilePath, JSON.stringify(linkedUsers, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link your Roblox account')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Your Roblox username')
                .setRequired(true)
        ),
    async execute(interaction) {
        console.log('Interaction received:', interaction.commandName);

        if (!interaction.isCommand()) return;

        if (interaction.commandName === 'link') {
            console.log('Link command triggered');
            const robloxUsername = interaction.options.getString('username');

            const existingUser = linkedUsers.find(user => user.discordId === interaction.user.id);
            if (existingUser) {
                return interaction.reply({ content: `Database: ${interaction.username}`, ephemeral: true });
            }

            let robloxId;
            try {
                robloxId = await noblox.getIdFromUsername(robloxUsername);
            } catch (error) {
                return interaction.reply({ content: `Error fetching Roblox data: ${error.message}`, ephemeral: true });
            }

            const verificationPhrase = uuidv4();
            const confirmEmbed = new EmbedBuilder()
                .setTitle('<:icon_link:1289605369231970395> SAHP Linking')
                .setDescription(`> Hey, ${interaction.user.username}\n> please confirm the details by pressing on the button which says "Confirm"\n> **Why is this needed?**\n> This linking system will help us rank users faster.`)
                .setFooter({ text: 'SAHP Automation | V0.2' })
                .addFields(
                    { name: '`Detected Username`', value: robloxUsername },
                    { name: '`Roblox ID`', value: robloxId.toString() },
                    { name: '\nQuick Information', value: '*You have **60 Seconds** to confirm or cancel the linking process, before it will get automatically canceled*'}
                )
                .setColor('#0099ff');

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_link')
                        .setLabel('Confirm')
                        .setEmoji('<a:approve:1289605554276139099>') // Set a valid emoji
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel_link')
                        .setLabel('Cancel')
                        .setEmoji('<a:deny:1289605493886554273>')
                        .setStyle(ButtonStyle.Danger)
                );

            try {
                await interaction.user.send({ embeds: [confirmEmbed], components: [confirmRow] });
                console.log(`[INFO] Confirmation DM sent to ${interaction.user.username}`);

                const filter = i => i.user.id === interaction.user.id;
                const collector = interaction.user.dmChannel.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async (i) => {
                    await handleConfirmation(i, robloxUsername, robloxId, verificationPhrase, interaction);
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        console.log('[INFO] Confirmation collector timed out.');
                        interaction.user.send('⏳ Confirmation process timed out. Please run the command again.');
                    }
                });

                await interaction.reply({ content: 'A DM has been sent to you to complete the linking process.', ephemeral: true });
            } catch (error) {
                console.error(`[ERROR] Failed to send DM to ${interaction.user.username}: ${error.message}`);
                await interaction.reply({ content: '🚫 I could not send you a DM. Please check your DM settings and try again.', ephemeral: true });
            }
        }
    }
};

async function handleConfirmation(i, robloxUsername, robloxId, verificationPhrase, interaction) {
    await i.user.createDM()
    if (i.customId === 'confirm_link') {
        await i.update({
            content: `Hey, ${interaction.user.username}\nyou have successfully confirmed your account details, now please follow the enw instructions!`,
            embeds: [],
            components: []
        });

        const verifyEmbed = new EmbedBuilder()
            .setTitle('SAHP Linking | Step 2/2')
            .setDescription(`> **1.** Copy this phrase: ${verificationPhrase}\n> **2.** Paste it in your Roblox profile.\n> **3.** Click "Check Phrase" below.`)
            .setColor('#0099ff');

        const verifyRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('check_phrase')
                    .setLabel('Check Phrase')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('mobile_copy')
                    .setLabel('Mobile Copy')
                    .setStyle(ButtonStyle.Secondary)
            );

        try {
            await i.user.send({ embeds: [verifyEmbed], components: [verifyRow] });
            console.log(`[INFO] Verification instructions sent to user ${interaction.user.username}`);

            const filter = buttonInteraction => buttonInteraction.user.id === i.user.id;
            const phraseCollector = i.user.dmChannel.createMessageComponentCollector({ filter, time: 60000 });

            phraseCollector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.customId === 'check_phrase') {
                    const profileDescription = await noblox.getBlurb(robloxId);

                    if (profileDescription.includes(verificationPhrase)) {
                        await buttonInteraction.update({
                            content: `Completed Linking, successfully connected you with ${robloxUsername}`,
                            embeds: [

                            ],
                            components: []
                        });

                        const linkedUser = {
                            discordId: interaction.user.id,
                            discordUser: interaction.username,
                            robloxUsername,
                            robloxId,
                            verificationPhrase,
                            linkedAt: new Date()
                        };
                        linkedUsers.push(linkedUser);
                        saveLinkedUsers();
                        console.log(`[INFO] User ${interaction.user.username} linked their Roblox account successfully.`);
                    } else {
                        await buttonInteraction.reply({ content: 'Seem`s like you have not added the provided phase in your **About me**, please make sure to save it, and press Check Phrase Again!', ephemeral: true });
                    }
                } else if (buttonInteraction.customId === 'mobile_copy') {
                    await buttonInteraction.reply({ content: `${verificationPhrase}`, ephemeral: true });
                }
            });

            phraseCollector.on('end', collected => {
                if (collected.size === 0) {
                    console.log('[INFO] Phrase collector timed out.');
                    interaction.user.send('⏳ Confirmation process timed out. Please run the command again.');
                }
            });

        } catch (error) {
            console.error(`[ERROR] Failed to send verification message to ${interaction.user.username}: ${error.message}`);
            await interaction.user.send('🚫 I could not send you the verification instructions. Please check your DM settings and try again.');
        }

    } else if (i.customId === 'cancel_link') {
        await i.update({ content: 'You have cancelled the SAHP Linking Proccess!\n Return to the SAHP Server, and run again `/link`.', embeds: [], components: [] });
    }
}
