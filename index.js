#!/usr/bin/node

const axios      = require('axios');
const cheerio    = require('cheerio');
const opn        = require('opn');
const nodemailer = require('nodemailer');

require('dotenv').config();

const CHECK_URL = 'https://vacinajoinville.com.br/';
const AGE_CHECK = parseInt(process.env.AGE_CHECK || 65, 10);
const NEXT_CHECK_TIMEOUT = 60;

(async () => {
    const check = async () => {
        const { data } = await axios.get(
            CHECK_URL,
            {
                headers: {
                    'User-Agent': `vacinaminhamaecarai/${AGE_CHECK}anos`,
                },
            }
        );

        const $ = cheerio.load(data);

        const vaccination = $('.card-group .card:last').find('i');
        const schedule = $('.card.mt-3 h5.card-header i');

        const isVaccinating = vaccination.is('.fa.fa-check-circle');
        const isScheduling = schedule.is('.fa.fa-check-circle')
            || schedule.parent().text().trim().toLowerCase().indexOf('disponível') !== -1;

        let vaccinatingAge = null;

        if (isVaccinating) {
            vaccinatingAge = vaccination.parent().text().trim().match(/\d+/g);

            if (vaccinatingAge) {
                vaccinatingAge = vaccinatingAge.map(age => parseInt(age, 10)).sort().shift();
            }
        }

        console.log(`Vaccinating: ${isVaccinating ? `\x1b[32mYES\x1b[0m - ${vaccinatingAge ? `${vaccinatingAge} years old` : 'any age'}` : "\x1b[31mNO\x1b[0m"}`);
        console.log(`Scheduling: ${isScheduling ? "\x1b[32mYES\x1b[0m" : "\x1b[31mNO\x1b[0m"}`);

        if (isVaccinating && isScheduling && (!vaccinatingAge || vaccinatingAge <= AGE_CHECK)) {
            console.log('Enabled schedule!');
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

        const nextCheckIn = NEXT_CHECK_TIMEOUT * (!isVaccinating || isScheduling ? 2 : 1) * 1000;
        console.log(`Next check at ${new Date(Date.now() + nextCheckIn).toLocaleTimeString()}\n`);
        setTimeout(check, nextCheckIn);
    };

    await check();
})();
