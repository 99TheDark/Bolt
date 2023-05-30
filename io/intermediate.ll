; ModuleID = 'script'
source_filename = "script"

define void @main() {
entry:
  ret void
}

define double @fn_add(double %0, double %1) {
entry:
  %2 = fadd double %0, %1
  ret double %2
}
