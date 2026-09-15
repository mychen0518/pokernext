$ErrorActionPreference="Stop"
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
Set-Location "C:\Project\AI\POKERNEXT_Claude"

$p = "/grill-with-docs 請讀 docs/adr/0001-stack-and-repo-shape.md（status: proposed）與 .scratch/pokernext-foundation/spec.md。針對 ADR 的三個 Considered Options 與 Consequences 一輪一輪問我，直到沒有模糊點；每個定案立刻寫進 CONTEXT.md 或該 ADR，最後把 ADR status 改成 accepted。完成後 git commit。"
claude $p
