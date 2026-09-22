import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly fromName = 'Ndukego Homes';
  private fromAddress: string | null = null;

  /** Company inbox that receives internal alerts (new inquiries, reservations). */
  private readonly adminInbox: string;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const port = config.get<number>('SMTP_PORT') ?? 587;
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    this.fromAddress = config.get<string>('SMTP_FROM') ?? user ?? null;
    this.adminInbox =
      config.get<string>('ADMIN_NOTIFICATION_EMAIL') ??
      'ndukegoinvest.propertiesltd@gmail.com';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Email configured via ${host}`);
    } else {
      this.logger.warn(
        'SMTP not configured — emails will be logged to console. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable sending.',
      );
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter || !this.fromAddress) {
      this.logger.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${to}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Internal alert email to the company inbox. Safe to fire-and-forget —
   * failures are logged and never affect the caller's response.
   */
  private async notifyAdmin(subject: string, html: string) {
    await this.send(this.adminInbox, subject, html);
  }

  /** Shared dark header block used by all admin notification emails. */
  private adminEmailHeader(): string {
    return `
      <div style="background: #1a2e4a; padding: 24px; text-align: center;">
        <h1 style="color: #c89b3c; margin: 0; font-size: 22px;">Ndukego Homes</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">Admin Notification</p>
      </div>
    `;
  }

  private adminEmailFooter(): string {
    return `
      <div style="background: #f8fafc; padding: 16px 24px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Ndukego Investment &amp; Properties Limited — Lagos, Nigeria<br>
          Manage this inquiry in the admin portal → Inquiries.
        </p>
      </div>
    `;
  }

  /**
   * Alerts the company inbox that a new website inquiry was received.
   * Every inquiry submitted anywhere on the public site flows through here,
   * in addition to being stored on the admin Inquiries page.
   */
  async sendNewInquiryAdminNotification(data: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone: string;
    message?: string | null;
    propertyTitle?: string | null;
  }) {
    const name =
      [data.firstName, data.lastName].filter(Boolean).join(' ') ||
      'Unnamed visitor';
    const subject = `New inquiry — ${name}${data.propertyTitle ? ` (${data.propertyTitle})` : ''}`;
    const row = (label: string, value: string) => `
      <p style="margin: 0 0 10px; color: #475569; line-height: 1.6;">
        <strong style="color: #1a2e4a; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; display: block;">${label}</strong>
        ${value}
      </p>
    `;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${this.adminEmailHeader()}
        <div style="padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #1a2e4a; margin-top: 0;">New Website Inquiry</h2>
          ${row('Name', name)}
          ${row('Email', `<a href="mailto:${data.email}" style="color: #1a2e4a;">${data.email}</a>`)}
          ${row('Phone', `<a href="tel:${data.phone}" style="color: #1a2e4a;">${data.phone}</a>`)}
          ${data.propertyTitle ? row('Property', data.propertyTitle) : ''}
          ${data.message ? row('Message', data.message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) : ''}
        </div>
        ${this.adminEmailFooter()}
      </div>
    `;
    await this.notifyAdmin(subject, html);
  }

  /**
   * Alerts the company inbox that a new reservation request was received.
   */
  async sendNewReservationAdminNotification(data: {
    firstName: string;
    lastName?: string | null;
    email: string;
    phone: string;
    reservationNumber: string;
    propertyTitle: string;
  }) {
    const name = [data.firstName, data.lastName].filter(Boolean).join(' ');
    const subject = `New reservation — ${data.propertyTitle} (${data.reservationNumber})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${this.adminEmailHeader()}
        <div style="padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #1a2e4a; margin-top: 0;">New Reservation Request</h2>
          <div style="background: #f0f4f8; border-left: 4px solid #c89b3c; padding: 16px; margin: 0 0 24px; border-radius: 4px;">
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #1a2e4a; font-family: monospace;">${data.reservationNumber}</p>
          </div>
          <p style="margin: 0 0 10px; color: #475569; line-height: 1.6;"><strong style="color: #1a2e4a;">Property:</strong> ${data.propertyTitle}</p>
          <p style="margin: 0 0 10px; color: #475569; line-height: 1.6;"><strong style="color: #1a2e4a;">Customer:</strong> ${name}</p>
          <p style="margin: 0 0 10px; color: #475569; line-height: 1.6;"><strong style="color: #1a2e4a;">Email:</strong> <a href="mailto:${data.email}" style="color: #1a2e4a;">${data.email}</a></p>
          <p style="margin: 0; color: #475569; line-height: 1.6;"><strong style="color: #1a2e4a;">Phone:</strong> <a href="tel:${data.phone}" style="color: #1a2e4a;">${data.phone}</a></p>
        </div>
        ${this.adminEmailFooter()}
      </div>
    `;
    await this.notifyAdmin(subject, html);
  }

  // ─── Templates ─────────────────────────────────────────────────

  async sendInquiryConfirmation(
    to: string,
    data: {
      firstName: string;
      propertyTitle?: string;
    },
  ) {
    const subject = `We received your inquiry — Ndukego Homes`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a2e4a; padding: 24px; text-align: center;">
          <h1 style="color: #c89b3c; margin: 0; font-size: 22px;">Ndukego Homes</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">Gallery Platform</p>
        </div>
        <div style="padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #1a2e4a; margin-top: 0;">Thank you, ${data.firstName}!</h2>
          <p style="color: #475569; line-height: 1.6;">
            We've received your inquiry${data.propertyTitle ? ` about <strong>${data.propertyTitle}</strong>` : ''} and our team will be in touch with you shortly.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            In the meantime, you can browse more properties on our website.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.WEB_URL ?? 'http://localhost:3000'}/properties"
               style="background: #1a2e4a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Browse Properties
            </a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 16px 24px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Ndukego Investment &amp; Properties Limited — Lagos, Nigeria<br>
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
    await this.send(to, subject, html);
  }

  async sendReservationConfirmation(
    to: string,
    data: {
      firstName: string;
      reservationNumber: string;
      propertyTitle: string;
      expiresAt: Date;
    },
  ) {
    const subject = `Reservation ${data.reservationNumber} received — Ndukego Homes`;
    const expiry = data.expiresAt.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a2e4a; padding: 24px; text-align: center;">
          <h1 style="color: #c89b3c; margin: 0; font-size: 22px;">Ndukego Homes</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">Gallery Platform</p>
        </div>
        <div style="padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #1a2e4a; margin-top: 0;">Reservation Request Received</h2>
          <p style="color: #475569; line-height: 1.6;">Dear ${data.firstName},</p>
          <p style="color: #475569; line-height: 1.6;">
            Your reservation request for <strong>${data.propertyTitle}</strong> has been received.
            Our team will review it and contact you within 24–48 hours.
          </p>
          <div style="background: #f0f4f8; border-left: 4px solid #c89b3c; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Reservation Number</p>
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #1a2e4a; font-family: monospace;">${data.reservationNumber}</p>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">
            This reservation expires on <strong>${expiry}</strong> if not confirmed.
          </p>
        </div>
        <div style="background: #f8fafc; padding: 16px 24px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Ndukego Investment &amp; Properties Limited — Lagos, Nigeria
          </p>
        </div>
      </div>
    `;
    await this.send(to, subject, html);
  }

  async sendReservationStatusUpdate(
    to: string,
    data: {
      firstName: string;
      reservationNumber: string;
      propertyTitle: string;
      newStatus: string;
      notes?: string;
    },
  ) {
    const statusLabels: Record<
      string,
      { label: string; color: string; message: string }
    > = {
      CONFIRMED: {
        label: 'Confirmed',
        color: '#16a34a',
        message:
          'Great news! Your reservation has been confirmed. Our team will contact you soon to discuss the next steps.',
      },
      CANCELLED: {
        label: 'Cancelled',
        color: '#dc2626',
        message:
          'Your reservation has been cancelled. Please contact us if you believe this is an error or if you have any questions.',
      },
      EXPIRED: {
        label: 'Expired',
        color: '#d97706',
        message:
          'Your reservation has expired. You are welcome to submit a new reservation or contact us to discuss availability.',
      },
    };

    const statusInfo = statusLabels[data.newStatus] ?? {
      label: data.newStatus,
      color: '#1a2e4a',
      message: 'Your reservation status has been updated.',
    };

    const subject = `Reservation ${data.reservationNumber} — Status updated to ${statusInfo.label}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a2e4a; padding: 24px; text-align: center;">
          <h1 style="color: #c89b3c; margin: 0; font-size: 22px;">Ndukego Homes</h1>
        </div>
        <div style="padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #1a2e4a; margin-top: 0;">Reservation Update</h2>
          <p style="color: #475569;">Dear ${data.firstName},</p>
          <p style="color: #475569; line-height: 1.6;">
            Your reservation for <strong>${data.propertyTitle}</strong> has been updated.
          </p>
          <div style="display: inline-block; background: ${statusInfo.color}20; color: ${statusInfo.color}; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 16px;">
            ${statusInfo.label}
          </div>
          <p style="color: #475569; line-height: 1.6;">${statusInfo.message}</p>
          ${data.notes ? `<div style="background: #f8fafc; padding: 12px 16px; border-radius: 4px; margin-top: 16px;"><p style="margin: 0; color: #64748b; font-size: 13px;"><strong>Note from our team:</strong><br>${data.notes}</p></div>` : ''}
          <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
            Reservation reference: <strong style="font-family: monospace;">${data.reservationNumber}</strong>
          </p>
        </div>
        <div style="background: #f8fafc; padding: 16px 24px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Ndukego Investment &amp; Properties Limited
          </p>
        </div>
      </div>
    `;
    await this.send(to, subject, html);
  }

  async sendWelcome(to: string, data: { firstName: string }) {
    const subject = `Welcome to Ndukego Homes`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a2e4a; padding: 24px; text-align: center;">
          <h1 style="color: #c89b3c; margin: 0; font-size: 22px;">Ndukego Homes</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">Gallery Platform</p>
        </div>
        <div style="padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #1a2e4a; margin-top: 0;">Welcome, ${data.firstName}!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Your Ndukego Homes account has been created. You can now browse properties,
            save your favourites, and track your reservation requests.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.WEB_URL ?? 'http://localhost:3000'}/properties"
               style="background: #1a2e4a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Start browsing properties
            </a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 16px 24px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Ndukego Investment &amp; Properties Limited — Lagos, Nigeria
          </p>
        </div>
      </div>
    `;
    await this.send(to, subject, html);
  }
}
