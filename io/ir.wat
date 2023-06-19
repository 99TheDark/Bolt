(module
 (import "std" "println" (func $fn_println (param f64)))
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
  (if
   (f64.lt
    (f64.mul
     (local.get $y)
     (f64.const 4)
    )
    (local.get $z)
   )
   (then
    (call $fn_println
     (f64.const 3.4159)
    )
   )
  )
  (call $fn_println
   (local.get $x)
  )
  (call $fn_println
   (local.get $y)
  )
  (call $fn_println
   (local.get $z)
  )
 )
 (export "main" (func $main))
 (start $main)
)
