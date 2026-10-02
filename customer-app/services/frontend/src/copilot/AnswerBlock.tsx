// src/copilot/AnswerBlock.tsx
import type { AnswerBlockData } from './copilotScript'
import type { ApprovalDecision } from './useCopilot'
import CompareBlock from './blocks/CompareBlock'
import BarsBlock from './blocks/BarsBlock'
import SparkBlock from './blocks/SparkBlock'
import ListBlock from './blocks/ListBlock'
import ApprovalBlock from './blocks/ApprovalBlock'
import styles from './blocks.module.css'

interface AnswerBlockProps {
  block: AnswerBlockData
  approvalDecision?: ApprovalDecision
  onApprove?: () => void
  onDismiss?: () => void
}

export default function AnswerBlock({ block, approvalDecision, onApprove, onDismiss }: AnswerBlockProps) {
  return (
    <div className={styles.blockContainer}>
      {block.title && <div className={styles.blockTitle}>{block.title}</div>}
      {block.type === 'compare' && <CompareBlock rows={block.rows} />}
      {block.type === 'bars' && <BarsBlock rows={block.rows} />}
      {block.type === 'spark' && <SparkBlock values={block.values} stats={block.stats} />}
      {block.type === 'list' && <ListBlock rows={block.rows} />}
      {block.type === 'approval' && (
        <ApprovalBlock
          rows={block.rows}
          decision={approvalDecision}
          onApprove={onApprove ?? (() => {})}
          onDismiss={onDismiss ?? (() => {})}
        />
      )}
    </div>
  )
}
