# companion-module-integ-jnior

This Companion Module has been developed to control the Integ JNIOR 4 Series of automation controllers. Please reference the [JANOS Management Protocol](https://jnior.com/wp-content/uploads/dlm_uploads/2024/03/JANOS_Management_Protocol_JMP-1.pdf) document as it provides the framework upon which this module has been developed. This module requires JANOS software v1.8 or later.

Version 1.0 of this module includes basic utility control of the JNIOR Relay I/O ports. You can send relay open, close, toggle, and pulse commands from Companion to the JNIOR as part of a broader automation system. Variables exist for each of the JNIOR's relays, and are queried from the monitor message sent by the JNIOR on initial connection.

The ability to send arbitrary string commands to the JNIOR console has also been included for advanced use cases.

If there is a specific action or feature you'd like to see implemented, please post the request on the [GitHub Issues](https://github.com/bitfocus/companion-module-integ-jnior/issues) page.
