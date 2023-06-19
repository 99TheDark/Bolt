(module
 (func $main (local $x f64) (local $y f64)
  (local.set $x
   (f64.const 5)
  )
  (local.set $y
   (f64.const 12)
  )
 )
 (export "main" (func $main))
 (start $main)
)
