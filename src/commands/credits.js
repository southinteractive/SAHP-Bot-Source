const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const guild = {}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('credits')
        .setDescription('Shows the developers and contributors of the Bot'),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor('#00FF00') 
            .setThumbnail(client.user.avatarURL()) 
            .setTitle(`SAHP Automation | Credits`) 
            .setDescription(`> **${client.user.username}** is a multifunctional bot designed to automate tasks and provide help within the **SAHP**!`)
            .addFields(
                { name: '<:Lead_Dev_Badge:1289620028198490152> Developer:', value: '> **SouthInteractive**', inline: true },
                { name: '<:website:1289620031466111071> Useful Links:', value: `> [SAHP Website](https://website.sahp.fun)`, inline: true },
                { name: '<:information:1289620030090383492> About:', value: '> This bot was created to automate routine tasks and enhance the server’s experience. We are continuously working to improve and expand its capabilities.' }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
