(module
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
 )
 (export "main" (func $main))
 (start $main)
)
