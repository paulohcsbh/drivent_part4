import { prisma } from "@/config";

async function getRoom(roomId: number) {
    const room = await prisma.room.findFirst({
        where: {
            id: roomId
        }
    })
    return room;
}
const roomRepository = {
    getRoom
}
export default roomRepository;
