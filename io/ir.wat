(module
 (import "std" "println" (func $fn_println (param f64)))
 (func $main (local $abc f64) (local $a f64) (local $b f64)
  (local.set $abc
   (f64.const 12)
  )
  (func $anonymous42350 (param $a f64) (param $b f64) (result f64)
   (return
    (f64.add
     (local.get $a)
     (local.get $b)
    )
   )
  )
  (export "anonymous42350" (func $anonymous42350))
 )
 (export "main" (func $main))
 (start $main)
)
