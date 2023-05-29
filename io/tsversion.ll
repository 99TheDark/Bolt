; ModuleID = 'LLVMDialectModule'

@x = local_unnamed_addr global i32 5
@y = local_unnamed_addr global i32 12
@k = local_unnamed_addr global i1 true
@llvm.global_ctors = appending constant [0 x { i32, ptr, ptr }] zeroinitializer

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn
define void @k__cctor() local_unnamed_addr #0 !dbg !3 {
  %1 = load i32, ptr @y, align 4, !dbg !7
  %2 = load i32, ptr @x, align 4, !dbg !13
  %3 = icmp slt i32 %1, %2, !dbg !14
  %4 = icmp slt i32 %2, 8, !dbg !14
  %.0.i = or i1 %3, %4, !dbg !14
  store i1 %.0.i, ptr @k, align 1, !dbg !15
  ret void, !dbg !15
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind readonly willreturn
define i1 @some(double %0) local_unnamed_addr #1 !dbg !9 {
  %2 = load i32, ptr @y, align 4, !dbg !16
  %3 = load i32, ptr @x, align 4, !dbg !17
  %4 = icmp slt i32 %2, %3, !dbg !18
  %5 = sitofp i32 %3 to double, !dbg !18
  %6 = fcmp olt double %5, %0, !dbg !18
  %.0 = select i1 %4, i1 true, i1 %6, !dbg !18
  ret i1 %.0, !dbg !18
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn
define void @__mlir_gctors() local_unnamed_addr #0 !dbg !19 {
  %1 = load i32, ptr @y, align 4, !dbg !20
  %2 = load i32, ptr @x, align 4, !dbg !24
  %3 = icmp slt i32 %1, %2, !dbg !25
  %4 = icmp slt i32 %2, 8, !dbg !25
  %.0.i.i = or i1 %3, %4, !dbg !25
  store i1 %.0.i.i, ptr @k, align 1, !dbg !26
  ret void, !dbg !27
}

attributes #0 = { mustprogress nofree norecurse nosync nounwind willreturn }
attributes #1 = { mustprogress nofree norecurse nosync nounwind readonly willreturn }
