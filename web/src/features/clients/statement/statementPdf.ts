import type { jsPDF as JsPdf } from "jspdf"
import { formatTime } from "../../../lib/dates"
import { formatMoneyForMessage as money } from "../../../lib/whatsapp"
import type { StatementBlock, StatementReport, StatementTone } from "./statementReport"

// Cores do sistema (styles/index.css), discretas; o vermelho e o verde ficam para o resultado.
const colors = {
  ink: "#202329",
  muted: "#737881",
  line: "#e8eaee",
  page: "#f7f8fa",
  primary: "#d92d3b",
  primarySoft: "#fff0f1",
  success: "#16a34a",
  successSoft: "#f0fbf4",
}

// A4 em milímetros.
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 16
const RIGHT = PAGE_WIDTH - MARGIN
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const FOOTER_TOP = PAGE_HEIGHT - 16
const LINE = 5.2

const toneColors: Record<StatementTone, string> = {
  ink: colors.ink,
  success: colors.success,
  primary: colors.primary,
}

const resultStyles = {
  DEBT: { label: "VALOR EM ABERTO", color: colors.primary, background: colors.primarySoft },
  CREDIT: { label: "CRÉDITO DISPONÍVEL", color: colors.success, background: colors.successSoft },
  ZERO: { label: "SALDO ZERADO", color: colors.ink, background: colors.page },
}

// Saldo no início do período em palavras: "R$ 20,00 em aberto", "R$ 5,00 de crédito" ou "R$ 0,00".
function describeBalance(cents: number) {
  if (cents < 0) return `${money(-cents)} em aberto`
  if (cents > 0) return `${money(cents)} de crédito`
  return money(0)
}

// Ajustes no sentido do que o cliente deve: "+" aumenta a dívida, "-" abate. (Hífen comum: a fonte
// padrão do PDF não tem o sinal de menos tipográfico.)
function describeAdjustment(cents: number) {
  return `${cents > 0 ? "-" : "+"} ${money(Math.abs(cents))}`
}

class StatementWriter {
  y = MARGIN
  private readonly doc: JsPdf
  constructor(doc: JsPdf) {
    this.doc = doc
  }

  private font(size: number, style: "normal" | "bold" = "normal", color = colors.ink) {
    this.doc.setFont("helvetica", style)
    this.doc.setFontSize(size)
    this.doc.setTextColor(color)
  }

  // Começa outra página quando o bloco não cabe inteiro, para não dividir uma venda ao meio.
  ensureSpace(height: number) {
    if (this.y + height <= FOOTER_TOP - 4) return
    this.doc.addPage()
    this.y = MARGIN
  }

  divider(gap = 4) {
    this.doc.setDrawColor(colors.line)
    this.doc.setLineWidth(0.3)
    this.doc.line(MARGIN, this.y, RIGHT, this.y)
    this.y += gap
  }

  header(report: StatementReport) {
    this.doc.setFillColor(colors.page)
    this.doc.rect(0, 0, PAGE_WIDTH, 40, "F")
    this.font(18, "bold")
    this.doc.text("EXTRATO DE CONSUMO", PAGE_WIDTH / 2, 17, { align: "center" })
    this.font(8.5, "normal", colors.muted)
    this.doc.text(report.canteenName.toUpperCase(), PAGE_WIDTH / 2, 23, { align: "center" })

    // O período em destaque, num selo.
    this.font(8.5, "bold", colors.primary)
    const width = this.doc.getTextWidth(report.title) + 8
    this.doc.setFillColor(colors.primarySoft)
    this.doc.roundedRect((PAGE_WIDTH - width) / 2, 27, width, 7, 3.5, 3.5, "F")
    this.doc.text(report.title, PAGE_WIDTH / 2, 31.8, { align: "center" })
    this.y = 50
  }

  sectionTitle(text: string) {
    this.font(11.5, "bold")
    this.doc.text(text, MARGIN, this.y)
    this.y += 7
  }

  // Rótulo à esquerda e valor à direita; valores longos (vários filhos) quebram em linhas.
  row(label: string, value: string, options: { bold?: boolean; color?: string } = {}) {
    this.font(9.5, options.bold ? "bold" : "normal", options.color ?? colors.ink)
    const lines: string[] = this.doc.splitTextToSize(value, CONTENT_WIDTH * 0.6)
    this.ensureSpace(lines.length * LINE + 1.5)
    this.doc.text(lines, RIGHT, this.y, { align: "right" })
    this.font(9.5, "normal", colors.muted)
    this.doc.text(label, MARGIN, this.y)
    this.y += lines.length * LINE + 1.5
  }

  // Um lançamento do histórico: título, data e hora, detalhes, itens (nas vendas) e o valor.
  entry(entry: StatementBlock) {
    this.font(9.5)
    const items = entry.items.map((item) => ({
      lines: this.doc.splitTextToSize(item.label, CONTENT_WIDTH - 35) as string[],
      value: money(item.cents),
    }))
    this.font(8.5)
    const details = entry.details.flatMap(
      (detail) => this.doc.splitTextToSize(detail, CONTENT_WIDTH) as string[],
    )
    const height =
      7 +
      details.length * LINE +
      items.reduce((total, item) => total + item.lines.length * LINE, 0) +
      13 +
      (entry.note ? 4.5 : 0)
    // Começa outra página quando o lançamento não cabe inteiro, para não dividi-lo ao meio.
    this.ensureSpace(height)
    const textColor = entry.isReversed ? colors.muted : colors.ink

    this.font(10.5, "bold", textColor)
    this.doc.text(entry.title, MARGIN, this.y)
    if (entry.tag) {
      const titleWidth = this.doc.getTextWidth(entry.title)
      this.font(8, "bold", colors.primary)
      this.doc.text(entry.tag, MARGIN + titleWidth + 3, this.y)
    }
    this.font(8.5, "normal", colors.muted)
    this.doc.text(`${entry.date} - ${entry.time}`, RIGHT, this.y, { align: "right" })
    this.y += 6

    this.font(8.5, "normal", colors.muted)
    for (const detail of details) {
      this.doc.text(detail, MARGIN, this.y)
      this.y += LINE
    }

    for (const item of items) {
      this.font(9.5, "normal", textColor)
      this.doc.text(item.lines, MARGIN, this.y)
      this.doc.text(item.value, RIGHT, this.y, { align: "right" })
      this.y += item.lines.length * LINE
    }

    this.y += 1.5
    this.font(10, "bold", textColor)
    this.doc.text(entry.total.label, MARGIN, this.y)
    const valueColor = entry.isReversed ? colors.muted : toneColors[entry.total.tone]
    this.font(10, "bold", valueColor)
    this.doc.text(money(entry.total.cents), RIGHT, this.y, { align: "right" })
    if (entry.note) {
      this.y += 4.5
      this.font(8, "normal", colors.muted)
      this.doc.text(entry.note, MARGIN, this.y)
    }
    this.y += 5
    this.divider(6)
  }

  summary(report: StatementReport) {
    // O resumo fica inteiro na mesma página: título, as linhas e o quadro do resultado.
    const rows = report.adjustmentsCents !== 0 ? 4 : 3
    this.ensureSpace(7 + rows * (LINE + 1.5) + 2 + 22)
    this.sectionTitle("Resumo financeiro")
    this.row("Saldo no início do período", describeBalance(report.openingBalanceCents))
    this.row("Total de compras", money(report.purchasedCents), { bold: true })
    this.row("Pagamentos realizados", money(report.paidCents), { bold: true, color: colors.success })
    if (report.adjustmentsCents !== 0) {
      this.row(
        "Ajustes (saldo anterior, estornos e devoluções)",
        describeAdjustment(report.adjustmentsCents),
        { bold: true },
      )
    }

    const style = resultStyles[report.result]
    this.y += 2
    this.doc.setFillColor(style.background)
    this.doc.roundedRect(MARGIN, this.y, CONTENT_WIDTH, 22, 3, 3, "F")
    this.font(8.5, "bold", colors.muted)
    this.doc.text(style.label, MARGIN + 5, this.y + 8)
    this.font(8, "normal", colors.muted)
    this.doc.text("Situação no fim do período", MARGIN + 5, this.y + 17)
    this.font(18, "bold", style.color)
    this.doc.text(money(Math.abs(report.closingBalanceCents)), RIGHT - 5, this.y + 14, { align: "right" })
    this.y += 28
  }

  // Rodapé em todas as páginas, com a numeração.
  footers(generatedAt: Date) {
    const pages = this.doc.getNumberOfPages()
    const date = new Intl.DateTimeFormat("pt-BR").format(generatedAt)
    const time = formatTime(generatedAt.toISOString())
    for (let page = 1; page <= pages; page++) {
      this.doc.setPage(page)
      this.doc.setDrawColor(colors.line)
      this.doc.setLineWidth(0.3)
      this.doc.line(MARGIN, FOOTER_TOP, RIGHT, FOOTER_TOP)
      this.font(7.5, "normal", colors.muted)
      this.doc.text(
        `Extrato gerado automaticamente pelo sistema em ${date} às ${time}.`,
        MARGIN,
        FOOTER_TOP + 5,
      )
      this.doc.text(`Página ${page} de ${pages}`, RIGHT, FOOTER_TOP + 5, { align: "right" })
    }
  }
}

// Desenha o extrato e devolve o arquivo PDF. A biblioteca só é baixada quando alguém gera um extrato.
export async function createStatementPdf(report: StatementReport, generatedAt = new Date()) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  doc.setProperties({ title: `Extrato de consumo - ${report.clientName} - ${report.title}` })
  const writer = new StatementWriter(doc)

  writer.header(report)
  writer.sectionTitle("Dados do cliente")
  writer.row("Responsável", report.clientName, { bold: true })
  if (report.consumers.length > 0) {
    writer.row(report.consumers.length > 1 ? "Alunos" : "Aluno(a)", report.consumers.join(", "), {
      bold: true,
    })
  }
  writer.row("Período", report.periodLabel, { bold: true })
  writer.y += 2
  writer.divider(8)

  writer.sectionTitle("Histórico de lançamentos")
  if (report.entries.length === 0) {
    writer.row("Nenhum lançamento neste período.", "")
    writer.y += 2
    writer.divider(8)
  }
  for (const entry of report.entries) writer.entry(entry)

  writer.summary(report)
  writer.footers(generatedAt)

  return new File([doc.output("blob")], report.fileName, { type: "application/pdf" })
}
