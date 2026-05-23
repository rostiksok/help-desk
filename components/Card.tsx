import styles from './Card.module.css';

interface Props {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  accentTop?: boolean;
}

export default function Card({ children, className = '', noPadding, accentTop }: Props) {
  const classes = [
    styles.card,
    noPadding ? styles.noPadding : '',
    accentTop ? styles.accentTop : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}
