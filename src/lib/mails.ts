    import nodemailer from "nodemailer";

    export async function getMailCLient(){
        const account = await nodemailer.createTestAccount();
        
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: account.user,
                pass: account.pass,
            },
            tls: {
                rejectUnauthorized: false,
            }
        });
        return transporter;
    }