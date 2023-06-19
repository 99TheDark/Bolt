(module
 (import "std" "println" (func $fn_println (param f64)))
 (func $fn_add (param $a f64) (param $b f64) (result f64)
  (return
   (f64.add
    (local.get $a)
    (local.get $b)
   )
  )
 )
 (export "fn_add" (func $fn_add))
 (func $main
 )
 (export "main" (func $main))
 (start $main)
)
