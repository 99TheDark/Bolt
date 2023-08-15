.global _main
.align 2

_fib:
    fmov s0, #7
    ret 

_main:
    bl _fib
    ret 

_print:
    mov X0, #1          // stdout
    adr X1, helloworld  // address of string
    mov X2, #14         // length of string
    mov X16, #4         // print
    svc 0               // syscall

helloworld:
    .ascii "Hello, world!"