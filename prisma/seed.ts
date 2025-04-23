import { PrismaClient } from '@/generated/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Supprimer les données existantes (optionnel, utile pendant le développement)
    await prisma.negotiation.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.roomsTypes.deleteMany();
    await prisma.room.deleteMany();
    await prisma.usersHotels.deleteMany();
    await prisma.hotel.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.type.deleteMany();

    console.log('🧹 Nettoyage de la base de données terminé');

    // Créer les rôles
    const adminRole = await prisma.role.create({
        data: {
            name: 'ADMIN',
        },
    });

    const managerRole = await prisma.role.create({
        data: {
            name: 'MANAGER',
        },
    });

    const clientRole = await prisma.role.create({
        data: {
            name: 'CLIENT',
        },
    });

    console.log('👑 Rôles créés');

    // Créer les types de chambre
    const typesSeed = [
        { name: 'Suite' },
        { name: 'Simple' },
        { name: 'Double' },
        { name: 'Familiale' },
        { name: 'Prestige' }
    ];

    const types = await Promise.all(
        typesSeed.map(type =>
            prisma.type.create({
                data: type,
            })
        )
    );

    console.log('🏷️ Types de chambre créés');

    // Créer utilisateur administrateur
    const adminPasswordHash = await hash('Admin123!', 10);
    const admin = await prisma.user.create({
        data: {
            firstname: 'Admin',
            lastname: 'System',
            email: 'admin@hotelapp.com',
            password: adminPasswordHash,
            address: '123 Admin Street',
            city: 'Paris',
            zipCode: '75000',
            phone: '0123456789',
            roleId: adminRole.id,
        },
    });

    console.log('👨‍💼 Utilisateur admin créé');

    // Créer quelques managers
    const managerPasswordHash = await hash('Manager123!', 10);
    const managers = await Promise.all([
        prisma.user.create({
            data: {
                firstname: 'Jean',
                lastname: 'Dupont',
                email: 'jean.dupont@hotelapp.com',
                password: managerPasswordHash,
                address: '15 Boulevard Haussmann',
                city: 'Paris',
                zipCode: '75008',
                phone: '0687654321',
                siret: '12345678901234',
                roleId: managerRole.id,
            },
        }),
        prisma.user.create({
            data: {
                firstname: 'Marie',
                lastname: 'Laurent',
                email: 'marie.laurent@hotelapp.com',
                password: managerPasswordHash,
                address: '42 Avenue de la République',
                city: 'Lyon',
                zipCode: '69002',
                phone: '0789012345',
                siret: '98765432109876',
                roleId: managerRole.id,
            },
        }),
    ]);

    console.log('👨‍💼 Managers créés');

    // Créer quelques clients
    const clientPasswordHash = await hash('Client123!', 10);
    const clients = await Promise.all([
        prisma.user.create({
            data: {
                firstname: 'Sophie',
                lastname: 'Martin',
                email: 'sophie.martin@example.com',
                password: clientPasswordHash,
                address: '8 Rue du Commerce',
                city: 'Bordeaux',
                zipCode: '33000',
                phone: '0612345678',
                roleId: clientRole.id,
            },
        }),
        prisma.user.create({
            data: {
                firstname: 'Thomas',
                lastname: 'Petit',
                email: 'thomas.petit@example.com',
                password: clientPasswordHash,
                address: '27 Rue des Lilas',
                city: 'Marseille',
                zipCode: '13001',
                phone: '0723456789',
                roleId: clientRole.id,
            },
        }),
        prisma.user.create({
            data: {
                firstname: 'Julie',
                lastname: 'Moreau',
                email: 'julie.moreau@example.com',
                password: clientPasswordHash,
                address: '5 Avenue Victor Hugo',
                city: 'Nice',
                zipCode: '06000',
                phone: '0634567890',
                roleId: clientRole.id,
            },
        }),
    ]);

    console.log('👨‍👩‍👧 Clients créés');

    // Créer des hôtels
    const hotels = await Promise.all([
        prisma.hotel.create({
            data: {
                name: 'Hôtel Luxor Palace',
                rate: 4.8,
                address: '1 Place Vendôme',
                city: 'Paris',
                zipCode: '75001',
                phone: '0143123456',
            },
        }),
        prisma.hotel.create({
            data: {
                name: 'Le Méridien Nice',
                rate: 4.5,
                address: '12 Promenade des Anglais',
                city: 'Nice',
                zipCode: '06000',
                phone: '0493456789',
            },
        }),
        prisma.hotel.create({
            data: {
                name: 'Château Bordeaux',
                rate: 4.3,
                address: '58 Quai des Chartrons',
                city: 'Bordeaux',
                zipCode: '33000',
                phone: '0556789012',
            },
        }),
    ]);

    console.log('🏨 Hôtels créés');

    // Associer les managers à des hôtels
    await prisma.usersHotels.createMany({
        data: [
            { userId: managers[0].id, hotelId: hotels[0].id },
            { userId: managers[1].id, hotelId: hotels[1].id },
            { userId: managers[1].id, hotelId: hotels[2].id },
        ],
    });

    console.log('🔄 Association managers-hôtels créée');

    // Créer des chambres pour chaque hôtel
    const rooms = [];
    for (const hotel of hotels) {
        const hotelRooms = await Promise.all([
            prisma.room.create({
                data: {
                    name: `Suite Royale - ${hotel.name}`,
                    price: 450.0,
                    rate: 4.9,
                    content: 'Suite luxueuse avec vue panoramique, jacuzzi privatif et service de majordome inclus.',
                    categories: 'Luxe,Vue,Service Premium',
                    tags: 'jacuzzi,king size,vue panoramique,majordome',
                    hotelId: hotel.id,
                },
            }),
            prisma.room.create({
                data: {
                    name: `Chambre Double Supérieure - ${hotel.name}`,
                    price: 180.0,
                    rate: 4.5,
                    content: 'Chambre spacieuse avec lit double, vue sur le jardin et petit-déjeuner inclus.',
                    categories: 'Confort,Vue Jardin',
                    tags: 'lit double,petit-déjeuner,vue jardin',
                    hotelId: hotel.id,
                },
            }),
            prisma.room.create({
                data: {
                    name: `Chambre Familiale - ${hotel.name}`,
                    price: 250.0,
                    rate: 4.6,
                    content: 'Chambre spacieuse avec un lit double et deux lits simples, parfaite pour les familles.',
                    categories: 'Famille,Spacieux',
                    tags: 'famille,spacieux,multiple lits',
                    hotelId: hotel.id,
                },
            }),
        ]);

        rooms.push(...hotelRooms);
    }

    console.log('🛏️ Chambres créées');

    // Associer les types aux chambres
    const roomTypesData = [];

    // Suite Royale (type Suite et Prestige)
    for (let i = 0; i < hotels.length; i++) {
        roomTypesData.push(
            { roomId: rooms[i * 3].id, typeId: types[0].id }, // Suite
            { roomId: rooms[i * 3].id, typeId: types[4].id }, // Prestige
            { roomId: rooms[i * 3 + 1].id, typeId: types[2].id }, // Double
            { roomId: rooms[i * 3 + 2].id, typeId: types[3].id }, // Familiale
        );
    }

    await prisma.roomsTypes.createMany({
        data: roomTypesData,
    });

    console.log('🔄 Association types-chambres créée');

    // Créer quelques réservations
    const now = new Date();
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);

    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    await prisma.booking.createMany({
        data: [
            {
                price: rooms[0].price * 3, // 3 nuits
                roomId: rooms[0].id,
                userId: clients[0].id,
                startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30),
                endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 33),
            },
            {
                price: rooms[3].price * 5, // 5 nuits
                roomId: rooms[3].id,
                userId: clients[1].id,
                startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 45),
                endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 50),
            },
            {
                price: rooms[6].price * 2, // 2 nuits
                roomId: rooms[6].id,
                userId: clients[2].id,
                startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
                endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 17),
            },
        ],
    });

    console.log('📅 Réservations créées');

    // Créer quelques négociations
    await prisma.negotiation.createMany({
        data: [
            {
                userId: clients[0].id,
                roomId: rooms[1].id,
                status: 'PENDING',
                price: rooms[1].price * 0.85, // 15% de réduction demandée
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                userId: clients[1].id,
                roomId: rooms[4].id,
                status: 'ACCEPTED',
                price: rooms[4].price * 0.9, // 10% de réduction acceptée
                createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
                updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
            },
            {
                userId: clients[2].id,
                roomId: rooms[7].id,
                status: 'REJECTED',
                price: rooms[7].price * 0.7, // 30% de réduction rejetée
                createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
                updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 9),
            },
        ],
    });

    console.log('💬 Négociations créées');

    console.log('✅ Seed terminé avec succès');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });