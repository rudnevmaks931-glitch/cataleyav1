import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [userPlan, setUserPlan] = useState(null);

  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase
        .from("tariffs")
        .select("*");

      if (error) {
        console.error(error);
      } else {
        setPlans(data);
      }
    }

    fetchPlans();

    // Получаем текущий тариф пользователя
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("selected_plan")
      .eq("id", supabase.auth.user().id)
      .single();

    if (profileError) {
      console.error(profileError);
    } else {
      setUserPlan(profile?.selected_plan);
    }
  }, []);

  async function selectPlan(planId) {
    const { error } = await supabase
      .from("profiles")
      .update({ selected_plan: planId })
      .eq("id", supabase.auth.user().id);

    if (error) {
      console.error(error);
    } else {
      setUserPlan(planId);
    }
  }

  return (
    <div>
      <h1>Выберите тариф</h1>
      {plans.map((plan) => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <p>{plan.description}</p>
          <p>Токенов: {plan.token_limit}</p>
          <p>Цена: {plan.price} ₽</p>
          <button onClick={() => selectPlan(plan.id)} disabled={userPlan === plan.id}>
            {userPlan === plan.id ? "Выбран" : "Выбрать"}
          </button>
        </div>
      ))}
    </div>
  );
}
