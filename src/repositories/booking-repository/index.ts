import { prisma } from "@/config";

async function getBookings(userId: number) {
    const bookings = await prisma.booking.findFirst({
        where: {
            userId: userId
        }, include: {
            Room: true,
        }
    });
    return bookings;
}
async function getBookingByRoomId(roomId: number) {
    const booking = prisma.booking.findMany({
        where: {
            roomId
        },
        include: {
            Room: true
        }
    })
    return booking;

}
async function createBooking(roomId: number, userId: number) {
    return prisma.booking.create({
        data: {
            roomId,
            userId
        }
    })
}
async function updateBooking(id: number, roomId: number) {
    return prisma.booking.update({
        where: { id },
        data: {
            roomId: roomId
        }
    })

}

const bookingRepository = {
    getBookings,
    createBooking,
    getBookingByRoomId,
    updateBooking
}
export default bookingRepository;