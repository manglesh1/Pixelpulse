export async function getServerSideProps() {
  return {
    redirect: {
      destination: "https://pixelpulseplay.ca/waiver",
      permanent: false,
    },
  };
}

export default function WaiverPage() {
  return null;
}
