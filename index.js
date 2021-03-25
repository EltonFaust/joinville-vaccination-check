#!/usr/bin/node

const axios      = require('axios');
const cheerio    = require('cheerio');
const opn        = require('opn');
const nodemailer = require('nodemailer');

require('dotenv').config();

const CHECK_URL = 'https://vacinajoinville.com.br/';
const AGE_CHECK = parseInt(process.env.AGE_CHECK || 65, 10);
const NEXT_CHECK_TIMEOUT = 300;

(async () => {
    const check = async () => {
        const { data } = await axios.get(
            CHECK_URL,
            {
                headers: {
                    'User-Agent': 'vacinaminhamae/carai',
                },
            }
        );

        const $ = cheerio.load(data);
        const rows = $('table tbody tr');

        const vaccination = rows.first().find('td:last i').first();
        const schedule = rows.last().find('td:last i').first();

        const isVaccinating = vaccination.is('.fa.fa-check-circle');
        const isScheduling = schedule.is('.fa.fa-check-circle');

        let vaccinatingAge = null;

        if (isVaccinating) {
            vaccinatingAge = vaccination.parent().text().trim().match(/\d+/);

            if (vaccinatingAge) {
                vaccinatingAge = parseInt(vaccinatingAge[0], 10);
            }
        }

        console.log(`Vaccinating: ${isVaccinating ? `\x1b[32mYES\x1b[0m - ${vaccinatingAge ? `${vaccinatingAge} yeard old` : 'any age'}` : "\x1b[31mNO\x1b[0m"}`);
        console.log(`Scheduling: ${isScheduling ? "\x1b[32mYES\x1b[0m" : "\x1b[31mNO\x1b[0m"}`);

        if (isVaccinating && isScheduling && (!vaccinatingAge || vaccinatingAge <= AGE_CHECK)) {
            opn(CHECK_URL);

            if (
                process.env.SMTP_HOST
                && process.env.SMTP_PORT
                && process.env.SMTP_USER
                && process.env.SMTP_PASSWORD
                && process.env.NOTIFY_ORIGIN
                && process.env.NOTIFY_DESTINATION
            ) {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    tls: { rejectUnauthorized: false },
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASSWORD,
                    },
                });

                await transporter.sendMail({
                    from: process.env.NOTIFY_ORIGIN,
                    to: process.env.NOTIFY_DESTINATION,
                    subject: `Vaccine available for ${vaccinatingAge ? `${vaccinatingAge} yeard old` : 'any age'}`,
                    html: `Vaccine already available for schedule.<br><br><b>${CHECK_URL}</b>`,
                });
            }

            return;
        }

        console.log(`Next check in ${NEXT_CHECK_TIMEOUT} seconds\n`);
        setTimeout(check, NEXT_CHECK_TIMEOUT * 1000);
    };

    await check();
})();
