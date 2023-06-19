(module
 (import "std" "print" (func $fn_print (param f64)))
 (func $main (local $x f64) (local $y f64) (local $z f64)
  (local.set $x
   (f64.const 5)
  )
  (local.set $y
   (f64.const 12)
  )
  (local.set $z
   (f64.sub
    (f64.mul
     (local.get $x)
     (local.get $y)
    )
    (local.get $x)
   )
  )
  (call $fn_print
   (local.get $x)
  )
  (call $fn_print
   (local.get $y)
  )
  (call $fn_print
   (local.get $z)
  )
 )
 (export "main" (func $main))
 (start $main)
)
