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
 (func $anonymous_22143 (param $a i32) (result i32)
  (return
   (local.get $a)
  )
 )
 (export "anonymous_22143" (func $anonymous_22143))
 (func $main (local $sum f64) (local $iife i32)
  (local.set $sum
   (call $fn_add
    (f64.const 5)
    (f64.const 4)
   )
  )
  (local.set $iife
   (call $anonymous_22143
    (i32.const 1)
   )
  )
 )
 (export "main" (func $main))
 (start $main)
)
