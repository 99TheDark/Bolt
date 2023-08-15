.global _main
.align 2

_main:
    b _print
    b _terminate

_print:
    mov x0, #1          // stdout
    adr x1, helloworld  // address of string
    mov x2, #14         // length of string
    mov x16, #4         // print
    svc 0               // syscall

_terminate:
    mov x0, #0          // return 0
    mov x16, #1         // terminate
    svc 0               // syscall

helloworld:
    .ascii "Hello, world!"