    import { FastifyTypedInstance } from "../types/fastifyTyped";
    import z from "zod";
    import { getMailCLient } from "../lib/mails";
    import nodemailer from "nodemailer";
    import { prisma } from "../lib/prisma"
    import { ZodTypeProvider } from "fastify-type-provider-zod";
    import dayjs from "dayjs";
    import {env} from "../env"; 

    export function PostSchedules(server: FastifyTypedInstance){
        server.withTypeProvider<ZodTypeProvider>().post("/agendamento",{
            schema: {
                body: z.object({
                    destinary_name: z.string(),
                    destinary_email: z.string().email(),
                    dayId: z.string().uuid(),
                    horarioId: z.string().uuid()
                }),
            }
        }, async (request, reply)=> {
            try {
                const {destinary_name, destinary_email, dayId, horarioId} = request.body;

                const user = await prisma.clientes.findUnique({ where: {email: destinary_email}});
                if(!user){
                    return reply.status(400).send({error: "Cliente não econtrado!"});
                }

                const dia = await prisma.dias.findUnique({  where: { id: dayId} })
                const horarioLivre = await prisma.horarios.findUnique({
                    where: {
                        id: horarioId,
                        livre: true,
                    }
                })

                if(!horarioLivre){
                    return reply.status(401).send("Erro ao tentar agendar horario!");
                }

                const date = dayjs(dia?.day).format("DD/MM");
                const confirmatedLink = `${env.API_BASE_URL}/agendamento/confirm/${user.id}?dayId=${dayId}&horarioId=${horarioId}`;

                const mail = await getMailCLient();
                const message = await mail.sendMail({
                    from: {
                        name: "Equipe de atendimento",
                        address: "atendimento@teste.com"
                    },
                    to: {
                        name: destinary_name,
                        address: destinary_email,
                    },
                    subject: "Email de confirmação do agendamento do dia ... às ... horas",
                    html: `
                         <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                            <p>Você pré-agendou um corte de cabelo para o dia <strong>${date}</strong>, às <strong>${horarioLivre.horario}.</strong></p>
                            <p>Para confirmar seu corte, clique no link abaixo:</p>
                            <p><a href="${confirmatedLink}">Confirmar agendamento</a></p>
                            <p>Caso você não saiba do que se trata esse e-mail, apenas ignore ele.</p>
                        </div>
                    `.trim()
                });

                console.log(nodemailer.getTestMessageUrl(message));
                return reply.status(201).send(`Email enviado com sucesso para o email ${destinary_email} do(a) ${destinary_name}`);
            } catch (error) {
                return reply.status(500).send({error: "Erro interno do servidor"});
            }   
        })
    }