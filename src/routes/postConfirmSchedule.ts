    import { FastifyTypedInstance } from "../types/fastifyTyped";
    import { prisma } from "../lib/prisma"
    import z from "zod";
    import { ZodTypeProvider } from "fastify-type-provider-zod";

    export function PostConfirmSchedule(server: FastifyTypedInstance){
        server.withTypeProvider<ZodTypeProvider>().post("/agendamento/confirm/:userId", {
            schema: {
                params: z.object({
                    userId: z.string().uuid(),
                }),
                querystring: z.object({
                    dayId: z.string().uuid(),
                    horarioId: z.string().uuid()
                })
            }
        }, async (request, reply) => {
            try {
                const {userId} = request.params;
                const { dayId, horarioId } = request.query;

                const horarioLivre = await prisma.horarios.findUnique({ where: {id: horarioId, livre: true}})
                if(!horarioLivre) return reply.status(400).send({error: "O horario não está disponivel!"});
                
                const diaLivre = await prisma.dias.findUnique({where: {id: dayId }})
                if(!diaLivre) return reply.status(400).send({error: "O dia não está disponivel!"});

                const agendamentoExistente = await prisma.agendamentos.findFirst({
                    where: {
                        dayId,
                        horarioId,
                    }
                })
                if(agendamentoExistente) return reply.status(400).send({error: "Esse horario já está reservado!"})
                

                const agendamento = await prisma.agendamentos.create({
                    data: {
                        clientId: userId,
                        dayId,
                        horarioId,
                        confirmado: true
                    }
                })

                await prisma.horarios.update({
                        where: { id: horarioId, },
                        data: { livre: false,  }
                });

                return reply.status(201).send({
                    message: "Agendamento confirmado com sucesso!",
                    agendamento
                });
            } catch (error) {
                return reply.status(500).send({error: "Erro interno do servidor!"});
            }
        })
    }