require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// --- Définition des commandes slash ---
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Envoie un message à quelqu\'un')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('La personne à mentionner')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Le message à envoyer')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('repetitions')
        .setDescription('Nombre de fois à répéter (optionnel)')
        .setRequired(false)
        .setMinValue(1)
    ),
];

// --- Enregistrement des commandes auprès de Discord ---
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('Enregistrement des commandes slash...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands.map(c => c.toJSON()) }
    );
    console.log('Commandes enregistrées !');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des commandes :', error);
  }
}

// --- Bot prêt ---
client.once('clientReady', () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`);
  client.user.setActivity('spammer les gens 😈', { type: 0 }); // 0 = "Playing"
});

// --- Gestion des commandes ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    const utilisateur = interaction.options.getUser('utilisateur');
    const message = interaction.options.getString('message');
    const repetitions = interaction.options.getInteger('repetitions') ?? 1;

    const contenu = `${utilisateur} ${message}`;

    // On envoie la première réponse (obligatoire pour les slash commands)
    await interaction.reply(contenu);

    // Si répétitions > 1, on envoie les suivantes avec un petit délai
    for (let i = 1; i < repetitions; i++) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms entre chaque
      await interaction.channel.send(contenu);
    }
  }
});

// --- Gestion des commandes préfixées (!clear) ---
client.on('messageCreate', async message => {
  if (message.author.bot) return; // Ignore les messages des bots
  if (!message.content.startsWith('!clear')) return;

  // Vérifie que l'auteur a la permission de gérer les messages
  if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return message.reply('Tu n\'as pas la permission de faire ça.');
  }

  const args = message.content.split(' ');
  const nb = parseInt(args[1]);

  if (isNaN(nb) || nb < 1 || nb > 100) {
    return message.reply('Utilisation : `!clear <nombre>` (entre 1 et 100)');
  }

  // +1 pour supprimer aussi le message !clear lui-même
  await message.channel.bulkDelete(nb + 1, true);
});

// --- Démarrage ---
registerCommands().then(() => {
  client.login(process.env.DISCORD_TOKEN);
});
