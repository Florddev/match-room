import { PrismaClient } from "@/generated/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Nettoyage de la base de données
  await prisma.negotiation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.roomsTypes.deleteMany();
  await prisma.room.deleteMany();
  await prisma.usersHotels.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.type.deleteMany();

  console.log("🧹 Nettoyage de la base de données terminé");

  // Création des rôles
  const adminRole = await prisma.role.create({
    data: {
      name: "ADMIN",
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: "MANAGER",
    },
  });

  const clientRole = await prisma.role.create({
    data: {
      name: "CLIENT",
    },
  });

  console.log("👑 Rôles créés");

  // Création des types de chambre
  const typesSeed = [
    { name: "Suite" },
    { name: "Simple" },
    { name: "Double" },
    { name: "Familiale" },
    { name: "Prestige" },
    { name: "Économique" },
    { name: "Vue Mer" },
    { name: "Penthouse" },
  ];

  const types = await Promise.all(
    typesSeed.map((type) =>
      prisma.type.create({
        data: type,
      })
    )
  );

  console.log("🏷️ Types de chambre créés");

  // Création utilisateur administrateur
  const adminPasswordHash = await hash("Admin123!", 10);
  const admin = await prisma.user.create({
    data: {
      firstname: "Admin",
      lastname: "System",
      email: "admin@hotelapp.com",
      password: adminPasswordHash,
      address: "123 Admin Street",
      city: "Paris",
      zipCode: "75000",
      phone: "0123456789",
      roleId: adminRole.id,
    },
  });

  console.log("👨‍💼 Utilisateur admin créé");

  // Création du manager principal
  const managerPasswordHash = await hash("Manager123!", 10);
  const manager = await prisma.user.create({
    data: {
      firstname: "Philippe",
      lastname: "Durand",
      email: "philippe.durand@hotelapp.com",
      password: managerPasswordHash,
      address: "15 Boulevard Haussmann",
      city: "Paris",
      zipCode: "75008",
      phone: "0687654321",
      siret: "12345678901234",
      roleId: managerRole.id,
    },
  });

  console.log("👨‍💼 Manager principal créé");

  // Création du client principal
  const clientPasswordHash = await hash("Client123!", 10);
  const client = await prisma.user.create({
    data: {
      firstname: "Sophie",
      lastname: "Martin",
      email: "sophie.martin@example.com",
      password: clientPasswordHash,
      address: "8 Rue du Commerce",
      city: "Bordeaux",
      zipCode: "33000",
      phone: "0612345678",
      roleId: clientRole.id,
    },
  });

  console.log("👨‍👩‍👧 Client principal créé");

  // Création des hôtels dans les 4 villes
  const hotels = await Promise.all([
    prisma.hotel.create({
      data: {
        name: "Le Grand Paris",
        rate: 4.8,
        address: "1 Place Vendôme",
        city: "Paris",
        zipCode: "75001",
        phone: "0143123456",
      },
    }),
    prisma.hotel.create({
      data: {
        name: "Azur Riviera",
        rate: 4.5,
        address: "12 Promenade des Anglais",
        city: "Nice",
        zipCode: "06000",
        phone: "0493456789",
      },
    }),
    prisma.hotel.create({
      data: {
        name: "Château Bordeaux",
        rate: 4.3,
        address: "58 Quai des Chartrons",
        city: "Bordeaux",
        zipCode: "33000",
        phone: "0556789012",
      },
    }),
    prisma.hotel.create({
      data: {
        name: "Confluence Lyon",
        rate: 4.6,
        address: "25 Cours Charlemagne",
        city: "Lyon",
        zipCode: "69002",
        phone: "0472123456",
      },
    }),
  ]);

  console.log("🏨 Hôtels créés");

  // Association du manager aux hôtels
  await prisma.usersHotels.createMany({
    data: [
      { userId: manager.id, hotelId: hotels[0].id }, // Paris
      { userId: manager.id, hotelId: hotels[1].id }, // Nice
      { userId: manager.id, hotelId: hotels[2].id }, // Bordeaux
      { userId: manager.id, hotelId: hotels[3].id }, // Lyon
    ],
  });

  console.log("🔄 Association manager-hôtels créée");

  // Création des chambres pour chaque hôtel
  const roomsData = [];

  // Pour Paris
  roomsData.push(
    {
      name: "Suite Royale",
      price: 550.0,
      rate: 4.9,
      content: "Suite luxueuse avec vue sur la Tour Eiffel, jacuzzi privatif et service de majordome inclus.",
      categories: "Luxe,Vue,Service Premium",
      tags: "jacuzzi,king size,tour eiffel,majordome",
      hotelId: hotels[0].id,
      types: [types[0].id, types[4].id], // Suite, Prestige
    },
    {
      name: "Chambre Double Supérieure",
      price: 220.0,
      rate: 4.5,
      content: "Chambre spacieuse avec lit double, vue sur les jardins des Tuileries.",
      categories: "Confort,Vue Jardin",
      tags: "lit double,petit-déjeuner,vue jardin",
      hotelId: hotels[0].id,
      types: [types[2].id], // Double
    },
    {
      name: "Chambre Familiale",
      price: 280.0,
      rate: 4.6,
      content: "Chambre spacieuse avec un lit double et deux lits simples, parfaite pour les familles.",
      categories: "Famille,Spacieux",
      tags: "famille,spacieux,multiple lits",
      hotelId: hotels[0].id,
      types: [types[3].id], // Familiale
    }
  );

  // Pour Nice
  roomsData.push(
    {
      name: "Suite Vue Mer",
      price: 480.0,
      rate: 4.8,
      content: "Suite exceptionnelle avec terrasse privée et vue panoramique sur la Méditerranée.",
      categories: "Luxe,Vue Mer,Terrasse",
      tags: "terrasse,vue mer,luxe,king size",
      hotelId: hotels[1].id,
      types: [types[0].id, types[6].id], // Suite, Vue Mer
    },
    {
      name: "Chambre Économique",
      price: 120.0,
      rate: 4.0,
      content: "Chambre confortable et économique, idéale pour un court séjour professionnel.",
      categories: "Économique,Fonctionnel",
      tags: "économique,business,fonctionnel",
      hotelId: hotels[1].id,
      types: [types[5].id], // Économique
    },
    {
      name: "Suite Junior",
      price: 320.0,
      rate: 4.4,
      content: "Suite junior avec salon séparé et vue partielle sur la mer.",
      categories: "Suite,Confort",
      tags: "salon,spacieux,vue partielle mer",
      hotelId: hotels[1].id,
      types: [types[0].id], // Suite
    }
  );

  // Pour Bordeaux
  roomsData.push(
    {
      name: "Chambre Prestige Vignoble",
      price: 350.0,
      rate: 4.7,
      content: "Chambre prestige avec vue sur les vignobles bordelais et dégustation de vin offerte.",
      categories: "Prestige,Vue,Expérience",
      tags: "vignoble,dégustation vin,prestige",
      hotelId: hotels[2].id,
      types: [types[4].id], // Prestige
    },
    {
      name: "Chambre Simple",
      price: 110.0,
      rate: 4.2,
      content: "Chambre simple mais élégante avec lit queen-size et salle de bain en marbre.",
      categories: "Simple,Élégant",
      tags: "simple,marbre,élégant",
      hotelId: hotels[2].id,
      types: [types[1].id], // Simple
    },
    {
      name: "Suite Familiale Duplex",
      price: 390.0,
      rate: 4.5,
      content: "Suite familiale sur deux niveaux avec deux chambres et un salon.",
      categories: "Suite,Famille,Duplex",
      tags: "duplex,famille,deux chambres",
      hotelId: hotels[2].id,
      types: [types[0].id, types[3].id], // Suite, Familiale
    }
  );

  // Pour Lyon
  roomsData.push(
    {
      name: "Penthouse Panoramique",
      price: 600.0,
      rate: 4.9,
      content: "Penthouse luxueux au dernier étage avec vue à 360° sur Lyon et les Alpes.",
      categories: "Penthouse,Vue,Luxe",
      tags: "penthouse,vue 360,luxe,terrasse",
      hotelId: hotels[3].id,
      types: [types[7].id, types[4].id], // Penthouse, Prestige
    },
    {
      name: "Chambre Double Confort",
      price: 180.0,
      rate: 4.4,
      content: "Chambre double confortable avec vue sur la Saône et petit-déjeuner gastronomique inclus.",
      categories: "Double,Confort,Vue",
      tags: "vue rivière,gastronomie,confort",
      hotelId: hotels[3].id,
      types: [types[2].id], // Double
    },
    {
      name: "Suite Executive",
      price: 420.0,
      rate: 4.7,
      content: "Suite executive avec espace de travail dédié et service de conciergerie premium.",
      categories: "Suite,Business,Service",
      tags: "business,conciergerie,espace travail",
      hotelId: hotels[3].id,
      types: [types[0].id], // Suite
    }
  );

  // Création des chambres
  const rooms = [];
  for (const roomData of roomsData) {
    const { types: roomTypes, ...roomInfo } = roomData;
    const room = await prisma.room.create({
      data: roomInfo,
    });
    rooms.push({ room, types: roomTypes });
  }

  console.log("🛏️ Chambres créées");

  // Association des types aux chambres
  for (const roomData of rooms) {
    for (const typeId of roomData.types) {
      await prisma.roomsTypes.create({
        data: {
          roomId: roomData.room.id,
          typeId: typeId,
        },
      });
    }
  }

  console.log("🔄 Association types-chambres créée");

  // Date actuelle pour les réservations et négociations
  const now = new Date();

  // Création des réservations avec différents statuts
  const bookingsData = [
    {
      price: rooms[0].room.price * 3, // 3 nuits à Paris
      roomId: rooms[0].room.id,
      userId: client.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 18),
      status: "CONFIRMED",
      guestCount: 2,
    },
    {
      price: rooms[3].room.price * 4, // 4 nuits à Nice
      roomId: rooms[3].room.id,
      userId: client.id,
      startDate: new Date(now.getFullYear(), now.getMonth() + 1, 10),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 14),
      status: "PENDING",
      guestCount: 1,
    },
    {
      price: rooms[6].room.price * 2, // 2 nuits à Bordeaux
      roomId: rooms[6].room.id,
      userId: client.id,
      startDate: new Date(now.getFullYear(), now.getMonth() + 2, 5),
      endDate: new Date(now.getFullYear(), now.getMonth() + 2, 7),
      status: "CANCELLED",
      guestCount: 3,
    },
    {
      price: rooms[9].room.price * 5, // 5 nuits à Lyon
      roomId: rooms[9].room.id,
      userId: client.id,
      startDate: new Date(now.getFullYear(), now.getMonth() + 3, 15),
      endDate: new Date(now.getFullYear(), now.getMonth() + 3, 20),
      status: "COMPLETED",
      guestCount: 2,
      paymentDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30),
    },
  ];

  for (const bookingData of bookingsData) {
    await prisma.booking.create({
      data: bookingData,
    });
  }

  console.log("📅 Réservations créées");

  // Création des négociations avec différents statuts
  const negotiationsData = [
    {
      userId: client.id,
      roomId: rooms[1].room.id, // Chambre à Paris
      status: "PENDING",
      price: rooms[1].room.price * 0.85, // 15% de réduction demandée
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 35),
    },
    {
      userId: client.id,
      roomId: rooms[4].room.id, // Chambre à Nice
      status: "ACCEPTED",
      price: rooms[4].room.price * 0.9, // 10% de réduction acceptée
      startDate: new Date(now.getFullYear(), now.getMonth() + 1, 20),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 23),
    },
    {
      userId: client.id,
      roomId: rooms[7].room.id, // Chambre à Bordeaux
      status: "REJECTED",
      price: rooms[7].room.price * 0.7, // 30% de réduction rejetée
      startDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
      endDate: new Date(now.getFullYear(), now.getMonth() + 2, 18),
    },
    {
      userId: client.id,
      roomId: rooms[10].room.id, // Chambre à Lyon
      status: "COUNTER_OFFER",
      price: rooms[10].room.price * 0.8, // 20% de réduction contre-offre
      startDate: new Date(now.getFullYear(), now.getMonth() + 4, 5),
      endDate: new Date(now.getFullYear(), now.getMonth() + 4, 10),
    },
  ];

  for (const negotiationData of negotiationsData) {
    await prisma.negotiation.create({
      data: negotiationData,
    });
  }

  console.log("💬 Négociations créées");

  console.log("✅ Seed terminé avec succès");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });