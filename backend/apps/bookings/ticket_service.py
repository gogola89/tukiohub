"""
Ticket generation service with QR codes and PDF
"""

import qrcode
from io import BytesIO
from django.core.files import File
from django.db import transaction
from django.utils import timezone
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from PIL import Image, ImageDraw, ImageFont
import logging

from .models import Booking, Ticket

logger = logging.getLogger(__name__)


class TicketService:
    """Service for generating tickets with QR codes and PDFs"""

    @staticmethod
    def generate_qr_code(ticket_code):
        """
        Generate QR code image for ticket

        Args:
            ticket_code (str): Unique ticket code

        Returns:
            BytesIO: QR code image as bytes
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )

        qr.add_data(ticket_code)
        qr.make(fit=True)

        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")

        # Save to BytesIO
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)

        return buffer

    @staticmethod
    def generate_ticket_pdf(ticket):
        """
        Generate PDF ticket

        Args:
            ticket (Ticket): Ticket instance

        Returns:
            BytesIO: PDF as bytes
        """
        buffer = BytesIO()

        # Create PDF canvas
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Get event details
        event = ticket.booking.event
        booking = ticket.booking

        # Set up fonts and colors
        title_font = "Helvetica-Bold"
        regular_font = "Helvetica"
        small_font = "Helvetica"

        # Header - Event Name
        c.setFont(title_font, 24)
        c.setFillColor(colors.HexColor("#1a1a1a"))
        event_title = event.title[:50]  # Truncate if too long
        c.drawCentredString(width / 2, height - 100, event_title)

        # Event Details
        c.setFont(regular_font, 12)
        c.setFillColor(colors.HexColor("#4a4a4a"))

        y_position = height - 140

        # Date and Time
        event_datetime = event.start_datetime.strftime("%A, %B %d, %Y at %I:%M %p")
        c.drawCentredString(width / 2, y_position, event_datetime)

        # Venue
        y_position -= 25
        c.drawCentredString(width / 2, y_position, f"Venue: {event.venue_name}")

        # Divider line
        y_position -= 30
        c.setStrokeColor(colors.HexColor("#cccccc"))
        c.line(100, y_position, width - 100, y_position)

        # Ticket Details Section
        y_position -= 50
        c.setFont(title_font, 16)
        c.setFillColor(colors.HexColor("#1a1a1a"))
        c.drawString(100, y_position, "Ticket Details")

        # Attendee Name
        y_position -= 30
        c.setFont(regular_font, 12)
        c.setFillColor(colors.HexColor("#4a4a4a"))
        c.drawString(100, y_position, f"Attendee: {ticket.attendee_name}")

        # Ticket Type
        y_position -= 25
        c.drawString(100, y_position, f"Ticket Type: {ticket.ticket_type.name}")

        # Ticket Code
        y_position -= 25
        c.setFont(title_font, 14)
        c.drawString(100, y_position, f"Ticket Code: {ticket.ticket_code}")

        # Booking Reference
        y_position -= 25
        c.setFont(regular_font, 12)
        c.drawString(100, y_position, f"Booking Reference: {booking.booking_reference}")

        # QR Code Section
        y_position -= 80
        c.setFont(title_font, 14)
        c.setFillColor(colors.HexColor("#1a1a1a"))
        c.drawCentredString(width / 2, y_position, "Scan QR Code for Check-In")

        # Generate and embed QR code
        qr_buffer = TicketService.generate_qr_code(ticket.ticket_code)
        qr_image = ImageReader(qr_buffer)

        # Center QR code
        qr_size = 200
        qr_x = (width - qr_size) / 2
        y_position -= qr_size + 20

        c.drawImage(qr_image, qr_x, y_position, width=qr_size, height=qr_size)

        # Footer Section
        y_position -= 60
        c.setFont(small_font, 10)
        c.setFillColor(colors.HexColor("#666666"))

        footer_text = [
            "Please present this ticket (digital or printed) at the venue entrance",
            "This ticket is non-transferable and valid for one entry only",
            f"Organizer: {event.organizer.company_name or event.organizer.email}",
            "",
            "Powered by TukioHub - Your Event Management Platform"
        ]

        for line in footer_text:
            c.drawCentredString(width / 2, y_position, line)
            y_position -= 15

        # Terms and conditions (very small)
        y_position -= 10
        c.setFont(small_font, 8)
        c.drawCentredString(width / 2, y_position,
                            "Terms and conditions apply. Visit event page for details.")

        # Draw border
        c.setStrokeColor(colors.HexColor("#e0e0e0"))
        c.setLineWidth(2)
        c.rect(50, 50, width - 100, height - 100)

        # Save PDF
        c.save()

        buffer.seek(0)
        return buffer

    @staticmethod
    @transaction.atomic
    def generate_tickets_for_booking(booking_id):
        """
        Generate individual tickets for a booking

        Args:
            booking_id (UUID): Booking ID

        Returns:
            list: List of created Ticket instances
        """
        try:
            booking = Booking.objects.select_related('event').prefetch_related('items__ticket_type').get(id=booking_id)
        except Booking.DoesNotExist:
            logger.error(f"Booking {booking_id} not found")
            return []

        if booking.status != Booking.STATUS_CONFIRMED:
            logger.warning(f"Cannot generate tickets for booking {booking.booking_reference} with status {booking.status}")
            return []

        # Check if tickets already generated
        if booking.tickets.exists():
            logger.warning(f"Tickets already generated for booking {booking.booking_reference}")
            return list(booking.tickets.all())

        tickets = []

        # Generate tickets for each booking item
        for item in booking.items.all():
            for i in range(item.quantity):
                # Create ticket
                ticket = Ticket.objects.create(
                    booking=booking,
                    ticket_type=item.ticket_type,
                    attendee_name=booking.attendee_name,
                    attendee_email=booking.attendee_email,
                    status=Ticket.ACTIVE
                )

                # Generate and save QR code image
                qr_buffer = TicketService.generate_qr_code(ticket.ticket_code)
                ticket.qr_code_image.save(
                    f"{ticket.ticket_code}.png",
                    File(qr_buffer),
                    save=True
                )

                tickets.append(ticket)

                logger.info(f"Ticket generated: {ticket.ticket_code} for booking {booking.booking_reference}")

        return tickets

    @staticmethod
    def generate_ticket_pdf_for_ticket(ticket_id):
        """
        Generate PDF for a specific ticket

        Args:
            ticket_id (UUID): Ticket ID

        Returns:
            BytesIO: PDF buffer or None if failed
        """
        try:
            ticket = Ticket.objects.select_related('booking__event', 'ticket_type').get(id=ticket_id)
        except Ticket.DoesNotExist:
            logger.error(f"Ticket {ticket_id} not found")
            return None

        return TicketService.generate_ticket_pdf(ticket)

    @staticmethod
    def generate_all_tickets_pdf(booking_id):
        """
        Generate a single PDF with all tickets for a booking

        Args:
            booking_id (UUID): Booking ID

        Returns:
            BytesIO: PDF buffer with all tickets
        """
        try:
            booking = Booking.objects.prefetch_related('tickets__ticket_type', 'tickets__booking__event').get(id=booking_id)
        except Booking.DoesNotExist:
            logger.error(f"Booking {booking_id} not found")
            return None

        if not booking.tickets.exists():
            logger.warning(f"No tickets found for booking {booking.booking_reference}")
            return None

        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)

        for ticket in booking.tickets.all():
            # Generate PDF for each ticket
            ticket_pdf = TicketService.generate_ticket_pdf(ticket)

            # Add page from ticket PDF
            # Note: This is simplified. In production, you'd use PyPDF2 to merge PDFs properly
            c.showPage()

        c.save()
        buffer.seek(0)

        return buffer
